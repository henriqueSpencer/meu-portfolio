import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toSnakeCase } from '../../utils/apiHelpers';
import { useClosedPositionMetrics } from '../../hooks/usePortfolio';
import {
  grahamFairPrice,
  bazinFairPrice,
  discountPremium,
  priceIndicator,
  returnPct,
} from '../../utils/calculations';
import {
  formatBRL,
  formatUSD,
  formatCurrency,
  formatPct,
  formatTimeHeld,
  colorClass,
} from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Globe, ArrowLeftRight, Plus } from 'lucide-react';
import { SECTOR_COLORS } from '../../data/mockData';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';
import ClosedPositionsSection from '../ClosedPositionsSection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a monetary value according to the local display currency toggle. */
function fmtMoney(valueUsd, displayCurrency, rate) {
  if (displayCurrency === 'BRL') return formatBRL(valueUsd * rate);
  return formatUSD(valueUsd);
}

/** Indicator dot colour based on priceIndicator result. */
function indicatorDot(indicator) {
  const map = {
    positive: 'bg-emerald-400',
    warning: 'bg-yellow-400',
    negative: 'bg-red-400',
    neutral: 'bg-slate-600',
  };
  return map[indicator] || map.neutral;
}

// ---------------------------------------------------------------------------
// Custom Tooltip for pie chart
// ---------------------------------------------------------------------------

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, pct } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-medium text-slate-200">{name}</p>
      <p className="text-slate-400">
        {formatUSD(value)} &middot; {pct.toFixed(1)}%
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EMPTY_INTL = {
  ticker: '', name: '', sector: '', type: 'Stock', qty: '', avgPriceUsd: '',
  fairPriceManual: '', broker: '',
};

function IntlStocksTab() {
  const { intlStocks, setIntlStocks, currency, exchangeRate, brokerFilter,
    createTransaction, intlStocksCrud } = useApp();

  // Local display-currency toggle (independent from global `currency`)
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  // ---- CRUD state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_INTL);

  function handleAdd() {
    setEditing(null);
    setForm(EMPTY_INTL);
    setModalOpen(true);
  }

  function handleEdit(stock) {
    setEditing(stock);
    setForm({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      type: stock.type || 'Stock',
      qty: String(stock.qty),
      avgPriceUsd: String(stock.avgPriceUsd),
      fairPriceManual: stock.fairPriceManual ? String(stock.fairPriceManual) : '',
      broker: stock.broker || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const parsed = {
      ticker: form.ticker.toUpperCase().trim(),
      name: form.name.trim(),
      sector: form.sector.trim(),
      type: form.type,
      qty: Number(form.qty) || 0,
      avgPriceUsd: Number(form.avgPriceUsd) || 0,
      currentPriceUsd: editing?.currentPriceUsd ?? 0,
      lpa: editing?.lpa ?? null,
      vpa: editing?.vpa ?? null,
      dividends5y: editing?.dividends5y ?? [],
      fairPriceManual: form.fairPriceManual ? Number(form.fairPriceManual) : null,
      broker: form.broker.trim(),
    };
    if (!parsed.ticker) return;
    const today = new Date().toISOString().slice(0, 10);
    if (editing) {
      const oldQty = editing.qty || 0;
      const newQty = parsed.qty;
      const delta = newQty - oldQty;
      setIntlStocks((prev) => prev.map((s) => (s.ticker === editing.ticker ? parsed : s)));
      if (delta !== 0) {
        await createTransaction({
          date: today,
          operationType: delta > 0 ? 'compra' : 'venda',
          assetClass: 'intl_stock',
          ticker: parsed.ticker,
          assetName: parsed.name,
          qty: Math.abs(delta),
          unitPrice: parsed.avgPriceUsd,
          broker: parsed.broker,
          notes: 'Ajuste via aba RV Exterior',
        });
      }
    } else {
      const assetData = { ...parsed, qty: 0, avgPriceUsd: 0 };
      await intlStocksCrud.create.mutateAsync(toSnakeCase(assetData, 'intlStock'));
      if (parsed.qty > 0) {
        await createTransaction({
          date: today,
          operationType: 'compra',
          assetClass: 'intl_stock',
          ticker: parsed.ticker,
          assetName: parsed.name,
          qty: parsed.qty,
          unitPrice: parsed.avgPriceUsd,
          broker: parsed.broker,
          notes: 'Posicao inicial via aba RV Exterior',
        });
      }
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!editing) return;
    if ((editing.qty || 0) > 0) {
      const today = new Date().toISOString().slice(0, 10);
      await createTransaction({
        date: today,
        operationType: 'venda',
        assetClass: 'intl_stock',
        ticker: editing.ticker,
        assetName: editing.name,
        qty: editing.qty,
        unitPrice: editing.currentPriceUsd || editing.avgPriceUsd,
        broker: editing.broker,
        notes: 'Encerramento de posicao via aba RV Exterior',
      });
    }
    // Don't remove from DB -- asset stays with qty=0 in closed section
    setModalOpen(false);
  }

  function handlePermanentDelete(stock) {
    setIntlStocks((prev) => prev.filter((s) => s.ticker !== stock.ticker));
  }

  // ---- Closed position metrics (lazy) ----
  const [metricsEnabled, setMetricsEnabled] = useState(false);
  const metricsQuery = useClosedPositionMetrics('intl_stock', metricsEnabled);

  const rate = exchangeRate; // alias for readability

  // ------ filtered list ------
  const filtered = useMemo(() => {
    if (!brokerFilter || brokerFilter === 'Todas') return intlStocks;
    return intlStocks.filter((s) => s.broker === brokerFilter);
  }, [intlStocks, brokerFilter]);

  // ------ active / closed split ------
  const activeItems = useMemo(() => filtered.filter((s) => (s.qty || 0) > 0), [filtered]);
  const closedItems = useMemo(() => filtered.filter((s) => (s.qty || 0) === 0), [filtered]);

  // ------ enriched rows ------
  const rows = useMemo(
    () =>
      activeItems.map((s) => {
        const usdReturn = returnPct(s.currentPriceUsd, s.avgPriceUsd);

        // BRL-adjusted return accounts for exchange movement.
        // If the user bought at avgPriceUsd when 1 USD = X BRL and now
        // 1 USD = `rate` BRL, the BRL return equals the full position growth
        // expressed in BRL.  Without a stored historical rate we approximate
        // the BRL return as the same USD return (the exchange impact is shown
        // separately).  When the toggle is BRL the displayed "Return %" is
        // simply the USD return (asset performance) -- the *exchange-adjusted*
        // column shows the compounded effect.
        //
        // Compounded BRL return = (1 + usdReturn/100) * (1 + fxChange/100) - 1
        // Since we lack historical FX we show usdReturn for both and explain
        // in the info card.  You can replace `fxChangePct` with real data.
        const fxChangePct = 0; // placeholder -- no historical FX stored
        const brlReturn =
          ((1 + usdReturn / 100) * (1 + fxChangePct / 100) - 1) * 100;

        const investedUsd = s.qty * s.avgPriceUsd;
        const currentUsd = s.qty * s.currentPriceUsd;
        const profitUsd = currentUsd - investedUsd;

        const graham =
          s.type === 'Stock' ? grahamFairPrice(s.lpa, s.vpa) : null;
        const bazin =
          s.type === 'Stock' && s.dividends5y
            ? bazinFairPrice(s.dividends5y)
            : null;

        // Use the lower of the two fair prices when both are available
        const fairPrice = graham && bazin ? Math.min(graham, bazin) : graham || bazin;
        const dp = fairPrice
          ? discountPremium(s.currentPriceUsd, fairPrice)
          : null;
        const indicator = priceIndicator(dp);

        return {
          ...s,
          usdReturn,
          brlReturn,
          investedUsd,
          currentUsd,
          profitUsd,
          graham,
          bazin,
          fairPrice,
          dp,
          indicator,
        };
      }),
    [activeItems, rate],
  );

  // ------ totals ------
  const totals = useMemo(() => {
    const invested = rows.reduce((s, r) => s + r.investedUsd, 0);
    const current = rows.reduce((s, r) => s + r.currentUsd, 0);
    const profit = current - invested;
    const pct = invested ? ((current - invested) / invested) * 100 : 0;
    return { invested, current, profit, pct };
  }, [rows]);

  // ------ sector distribution ------
  const sectorData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const key = r.sector || 'Outros';
      if (!map[key]) map[key] = 0;
      map[key] += r.currentUsd;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: (value / total) * 100,
        color: SECTOR_COLORS[name] || '#64748b',
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  // ------ render ------
  return (
    <div className="space-y-6">
      {/* ===== Header + Currency Toggle ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-100">
            Renda Variavel Exterior
          </h2>
          <button
            onClick={handleAdd}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Ativo
          </button>
        </div>

        {/* Segmented toggle */}
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/60 p-0.5">
          {['USD', 'BRL'].map((opt) => (
            <button
              key={opt}
              onClick={() => setDisplayCurrency(opt)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                displayCurrency === opt
                  ? 'bg-indigo-600/80 text-white shadow-inner shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowLeftRight className="h-3 w-3" />
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Stocks / ETFs Table ===== */}
      <div className="glass-card overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                {[
                  'Ticker',
                  'Nome',
                  'Tipo',
                  'Setor',
                  'Qtd',
                  `Preco Medio (${displayCurrency})`,
                  `Preco Atual (${displayCurrency})`,
                  'Retorno USD',
                  displayCurrency === 'BRL'
                    ? 'Retorno c/ Cambio'
                    : 'Retorno USD',
                  `Lucro/Prej (${displayCurrency})`,
                  'Graham (USD)',
                  'Bazin (USD)',
                  'Desconto/Premio',
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`whitespace-nowrap px-3 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 ${
                      i === 0 ? 'text-left' : 'text-right'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/40">
              {rows.map((r) => (
                <tr
                  key={r.ticker}
                  onClick={() => handleEdit(r)}
                  className="transition-colors hover:bg-slate-700/20 cursor-pointer"
                >
                  {/* Ticker */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-left font-bold text-slate-100">
                    {r.ticker}
                  </td>

                  {/* Name */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                    {r.name}
                  </td>

                  {/* Type */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        r.type === 'Stock'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : r.type === 'ETF'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>

                  {/* Sector */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-400">
                    {r.sector}
                  </td>

                  {/* Qty */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                    {r.qty}
                  </td>

                  {/* Avg Price */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                    {fmtMoney(r.avgPriceUsd, displayCurrency, rate)}
                  </td>

                  {/* Current Price */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                    {fmtMoney(r.currentPriceUsd, displayCurrency, rate)}
                  </td>

                  {/* Return % USD */}
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-medium ${colorClass(
                      r.usdReturn,
                    )}`}
                  >
                    {formatPct(r.usdReturn)}
                  </td>

                  {/* Return % with exchange impact */}
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-medium ${colorClass(
                      displayCurrency === 'BRL' ? r.brlReturn : r.usdReturn,
                    )}`}
                  >
                    {formatPct(
                      displayCurrency === 'BRL' ? r.brlReturn : r.usdReturn,
                    )}
                  </td>

                  {/* Profit / Loss */}
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-medium ${colorClass(
                      r.profitUsd,
                    )}`}
                  >
                    {fmtMoney(r.profitUsd, displayCurrency, rate)}
                  </td>

                  {/* Graham Fair Price */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                    {r.graham != null ? formatUSD(r.graham) : '-'}
                  </td>

                  {/* Bazin Fair Price */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                    {r.bazin != null ? formatUSD(r.bazin) : '-'}
                  </td>

                  {/* Discount / Premium */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    {r.dp != null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${indicatorDot(
                            r.indicator,
                          )}`}
                        />
                        <span
                          className={
                            r.dp <= 0 ? 'text-emerald-400' : 'text-red-400'
                          }
                        >
                          {formatPct(r.dp)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* ---- Total row ---- */}
              <tr className="border-t border-slate-600 bg-slate-700/30 font-semibold">
                <td className="whitespace-nowrap px-3 py-2.5 text-left text-slate-100">
                  Total
                </td>
                <td colSpan={4} />
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                  {fmtMoney(totals.invested, displayCurrency, rate)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-300">
                  {fmtMoney(totals.current, displayCurrency, rate)}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-2.5 text-right ${colorClass(
                    totals.pct,
                  )}`}
                >
                  {formatPct(totals.pct)}
                </td>
                <td />
                <td
                  className={`whitespace-nowrap px-3 py-2.5 text-right ${colorClass(
                    totals.profit,
                  )}`}
                >
                  {fmtMoney(totals.profit, displayCurrency, rate)}
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Closed Positions ===== */}
      <ClosedPositionsSection
        items={closedItems}
        title="Posicoes Encerradas"
        metrics={metricsQuery.data}
        metricsLoading={metricsQuery.isLoading && metricsEnabled}
        onExpand={() => setMetricsEnabled(true)}
        onPermanentDelete={handlePermanentDelete}
        columns={[
          { label: 'Ticker', align: 'left' },
          { label: 'Nome', align: 'left' },
          { label: 'Qtd', align: 'right' },
          { label: 'Total Compra', align: 'right' },
          { label: 'Total Venda', align: 'right' },
          { label: 'Lucro/Prej.', align: 'right' },
          { label: 'Lucro %', align: 'right' },
          { label: 'Dividendos', align: 'right' },
          { label: 'Lucro c/ Div', align: 'right' },
          { label: 'Lucro c/ Div %', align: 'right' },
          { label: 'Periodo', align: 'right' },
          { label: 'Tempo', align: 'right' },
        ]}
        renderRow={(item, m) => {
          const profit = m ? m.total_proceeds - m.total_cost : 0;
          const profitPct = m && m.total_cost > 0 ? (profit / m.total_cost) * 100 : 0;
          const profitWithDiv = m ? profit + (m.total_dividends || 0) : 0;
          const profitWithDivPct = m && m.total_cost > 0 ? (profitWithDiv / m.total_cost) * 100 : 0;
          return (
            <>
              <td className="py-2 px-2 text-sm font-bold text-slate-300">{item.ticker}</td>
              <td className="py-2 px-2 text-sm text-slate-400 whitespace-nowrap">{item.name}</td>
              <td className="py-2 px-2 text-sm text-slate-400 text-right tabular-nums">{m ? m.total_bought_qty : '-'}</td>
              <td className="py-2 px-2 text-sm text-slate-400 text-right tabular-nums whitespace-nowrap">{m ? formatUSD(m.total_cost) : '-'}</td>
              <td className="py-2 px-2 text-sm text-slate-400 text-right tabular-nums whitespace-nowrap">{m ? formatUSD(m.total_proceeds) : '-'}</td>
              <td className={`py-2 px-2 text-sm text-right tabular-nums whitespace-nowrap font-medium ${m ? colorClass(profit) : 'text-slate-400'}`}>
                {m ? formatUSD(profit) : '-'}
              </td>
              <td className={`py-2 px-2 text-sm text-right tabular-nums font-medium ${m ? colorClass(profit) : 'text-slate-400'}`}>
                {m ? formatPct(profitPct) : '-'}
              </td>
              <td className="py-2 px-2 text-sm text-emerald-400 text-right tabular-nums whitespace-nowrap">
                {m && m.total_dividends > 0 ? formatUSD(m.total_dividends) : '-'}
              </td>
              <td className={`py-2 px-2 text-sm text-right tabular-nums whitespace-nowrap font-medium ${m ? colorClass(profitWithDiv) : 'text-slate-400'}`}>
                {m ? formatUSD(profitWithDiv) : '-'}
              </td>
              <td className={`py-2 px-2 text-sm text-right tabular-nums font-medium ${m ? colorClass(profitWithDiv) : 'text-slate-400'}`}>
                {m ? formatPct(profitWithDivPct) : '-'}
              </td>
              <td className="py-2 px-2 text-sm text-slate-400 text-right whitespace-nowrap">
                {m?.first_buy_date && m?.last_sell_date ? `${m.first_buy_date.slice(5).replace('-', '/')} - ${m.last_sell_date.slice(5).replace('-', '/')}` : '-'}
              </td>
              <td className="py-2 px-2 text-sm text-slate-400 text-right whitespace-nowrap">
                {m ? formatTimeHeld(m.time_held_days) : '-'}
              </td>
            </>
          );
        }}
      />

      {/* ===== Bottom grid: Exchange Card + Sector Pie ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* -- Exchange Impact Info Card -- */}
        <div className="glass-card flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Impacto Cambial
            </h3>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-300">
              {rate.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">BRL / USD</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            O retorno em USD reflete apenas a valorizacao do ativo no mercado
            americano. Quando convertido para BRL, o resultado pode divergir
            significativamente devido a variacao cambial. Uma valorizacao do
            dolar frente ao real amplifica os ganhos em BRL, enquanto uma
            desvalorizacao do dolar os reduz. Acompanhe ambas as colunas para
            ter uma visao completa da rentabilidade.
          </p>

          <div className="mt-1 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-700/40 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Total Investido
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {formatUSD(totals.invested)}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatBRL(totals.invested * rate)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/40 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Total Atual
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {formatUSD(totals.current)}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatBRL(totals.current * rate)}
              </p>
            </div>
          </div>
        </div>

        {/* -- Sector Distribution Pie Chart -- */}
        <div className="glass-card flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur">
          <h3 className="text-sm font-semibold text-slate-200">
            Distribuicao por Setor
          </h3>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* Chart */}
            <div className="h-52 w-52 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {sectorData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <ul className="flex flex-col gap-2 text-xs">
              {sectorData.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-slate-300">{s.name}</span>
                  <span className="ml-auto pl-3 font-medium text-slate-400">
                    {s.pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* ---- CRUD Modal ---- */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${editing.ticker}` : 'Adicionar Ativo Internacional'}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ticker">
            <FormInput value={form.ticker} onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))} placeholder="AAPL" />
          </FormField>
          <FormField label="Tipo">
            <FormSelect value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="Stock">Stock</option>
              <option value="ETF">ETF</option>
              <option value="REIT">REIT</option>
            </FormSelect>
          </FormField>
        </div>
        <FormField label="Nome">
          <FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Apple Inc." />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Setor">
            <FormInput value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} placeholder="Technology" />
          </FormField>
          <FormField label="Corretora">
            <FormInput value={form.broker} onChange={(e) => setForm((f) => ({ ...f, broker: e.target.value }))} placeholder="Avenue" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Qtd">
            <FormInput type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
          </FormField>
          <FormField label="PM (USD)">
            <FormInput type="number" step="0.01" value={form.avgPriceUsd} onChange={(e) => setForm((f) => ({ ...f, avgPriceUsd: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Preco Justo Manual (USD)">
          <FormInput type="number" step="0.01" value={form.fairPriceManual} onChange={(e) => setForm((f) => ({ ...f, fairPriceManual: e.target.value }))} />
        </FormField>
      </FormModal>
    </div>
  );
}

export default IntlStocksTab;
