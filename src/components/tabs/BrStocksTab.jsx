import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  grahamFairPrice,
  bazinFairPrice,
  discountPremium,
  priceIndicator,
  returnPct,
} from '../../utils/calculations';
import { formatBRL, formatCurrency, formatPct, colorClass } from '../../utils/formatters';
import { SECTOR_COLORS } from '../../data/mockData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function discountBadge(dp) {
  if (dp === null || dp === undefined) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-400">
        N/A
      </span>
    );
  }

  const indicator = priceIndicator(dp);
  const label = `${dp > 0 ? '+' : ''}${dp.toFixed(1).replace('.', ',')}%`;

  const styles = {
    positive: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    negative: 'bg-red-500/20 text-red-400',
    neutral: 'bg-slate-700 text-slate-400',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${styles[indicator]}`}
    >
      {label}
    </span>
  );
}

function PieTooltipContent({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value, pct } = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-slate-200 font-medium">{name}</p>
      <p className="text-slate-400">
        {formatBRL(value)} ({pct.toFixed(1).replace('.', ',')}%)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function BrStocksTab() {
  const { brStocks, fiis, currency, exchangeRate, brokerFilter } = useApp();

  const [showStocks, setShowStocks] = useState(true);
  const [showFiis, setShowFiis] = useState(true);

  // ---- Filtered lists ----
  const filteredStocks = useMemo(
    () =>
      brokerFilter === 'Todas'
        ? brStocks
        : brStocks.filter((s) => s.broker === brokerFilter),
    [brStocks, brokerFilter],
  );

  const filteredFiis = useMemo(
    () =>
      brokerFilter === 'Todas'
        ? fiis
        : fiis.filter((f) => f.broker === brokerFilter),
    [fiis, brokerFilter],
  );

  // ---- Enriched stock rows (fair prices, discount, return) ----
  const stockRows = useMemo(
    () =>
      filteredStocks.map((stock) => {
        const graham = grahamFairPrice(stock.lpa, stock.vpa);
        const bazin = bazinFairPrice(stock.dividends5y);
        const fairCandidates = [graham, bazin].filter(Boolean);
        const calculatedFair =
          fairCandidates.length > 0 ? Math.min(...fairCandidates) : null;
        const fairPrice = stock.fairPriceManual || calculatedFair;
        const dp = discountPremium(stock.currentPrice, fairPrice);
        const ret = returnPct(stock.currentPrice, stock.avgPrice);
        const position = stock.qty * stock.currentPrice;
        const cost = stock.qty * stock.avgPrice;
        const profitLoss = position - cost;

        return {
          ...stock,
          graham,
          bazin,
          fairPrice,
          dp,
          ret,
          position,
          cost,
          profitLoss,
        };
      }),
    [filteredStocks],
  );

  // ---- Stocks totals ----
  const stockTotals = useMemo(() => {
    const totalPosition = stockRows.reduce((s, r) => s + r.position, 0);
    const totalCost = stockRows.reduce((s, r) => s + r.cost, 0);
    const totalProfitLoss = totalPosition - totalCost;
    const totalRet = totalCost > 0 ? ((totalPosition - totalCost) / totalCost) * 100 : 0;
    return { totalPosition, totalCost, totalProfitLoss, totalRet };
  }, [stockRows]);

  // ---- Enriched FII rows ----
  const fiiRows = useMemo(
    () =>
      filteredFiis.map((fii) => {
        const ret = returnPct(fii.currentPrice, fii.avgPrice);
        const position = fii.qty * fii.currentPrice;
        const cost = fii.qty * fii.avgPrice;
        const profitLoss = position - cost;
        return { ...fii, ret, position, cost, profitLoss };
      }),
    [filteredFiis],
  );

  // ---- FII totals ----
  const fiiTotals = useMemo(() => {
    const totalPosition = fiiRows.reduce((s, r) => s + r.position, 0);
    const totalCost = fiiRows.reduce((s, r) => s + r.cost, 0);
    const totalProfitLoss = totalPosition - totalCost;
    const totalRet = totalCost > 0 ? ((totalPosition - totalCost) / totalCost) * 100 : 0;
    return { totalPosition, totalCost, totalProfitLoss, totalRet };
  }, [fiiRows]);

  // ---- Sector distribution for pie chart ----
  const sectorData = useMemo(() => {
    const map = {};
    stockRows.forEach((r) => {
      if (!map[r.sector]) map[r.sector] = 0;
      map[r.sector] += r.position;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, pct: total ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [stockRows]);

  // =======================================================================
  // Render
  // =======================================================================
  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* STOCKS SECTION                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="glass-card p-5">
        <button
          onClick={() => setShowStocks((v) => !v)}
          className="w-full flex items-center justify-between cursor-pointer bg-transparent border-none outline-none"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              Acoes
            </h2>
            <span className="text-xs text-slate-500 ml-1">
              ({filteredStocks.length} ativos)
            </span>
          </div>
          <span className="text-slate-400 transition-transform duration-200">
            {showStocks ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showStocks ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Ticker
                  </th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Nome
                  </th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Setor
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Qtd
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    PM
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Atual
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Rent. %
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Lucro/Prej.
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Graham
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Bazin
                  </th>
                  <th className="text-center text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Desc./Premio
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    PJ Manual
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((row) => (
                  <tr
                    key={row.ticker}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-2 text-sm font-bold text-slate-100">
                      {row.ticker}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              SECTOR_COLORS[row.sector] || '#6366f1',
                          }}
                        />
                        {row.sector}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums">
                      {row.qty}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap">
                      {formatBRL(row.avgPrice)}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-100 text-right tabular-nums whitespace-nowrap">
                      {formatBRL(row.currentPrice)}
                    </td>
                    <td
                      className={`py-3 px-2 text-sm text-right tabular-nums font-medium ${colorClass(
                        row.ret,
                      )}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {row.ret >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {formatPct(row.ret)}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-2 text-sm text-right tabular-nums whitespace-nowrap font-medium ${colorClass(
                        row.profitLoss,
                      )}`}
                    >
                      {formatBRL(row.profitLoss)}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap">
                      {row.graham !== null ? formatBRL(row.graham) : '-'}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap">
                      {row.bazin !== null ? formatBRL(row.bazin) : '-'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {discountBadge(row.dp)}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-400 text-right tabular-nums whitespace-nowrap">
                      {row.fairPriceManual
                        ? formatBRL(row.fairPriceManual)
                        : '-'}
                    </td>
                  </tr>
                ))}

                {/* ---- Totals row ---- */}
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td
                    colSpan={3}
                    className="py-3 px-2 text-sm font-bold text-slate-100"
                  >
                    Total
                  </td>
                  <td className="py-3 px-2" />
                  <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap font-semibold">
                    {formatBRL(stockTotals.totalCost)}
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-100 text-right tabular-nums whitespace-nowrap font-semibold">
                    {formatBRL(stockTotals.totalPosition)}
                  </td>
                  <td
                    className={`py-3 px-2 text-sm text-right tabular-nums font-bold ${colorClass(
                      stockTotals.totalRet,
                    )}`}
                  >
                    {formatPct(stockTotals.totalRet)}
                  </td>
                  <td
                    className={`py-3 px-2 text-sm text-right tabular-nums whitespace-nowrap font-bold ${colorClass(
                      stockTotals.totalProfitLoss,
                    )}`}
                  >
                    {formatBRL(stockTotals.totalProfitLoss)}
                  </td>
                  <td colSpan={4} className="py-3 px-2" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FIIs SECTION                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="glass-card p-5">
        <button
          onClick={() => setShowFiis((v) => !v)}
          className="w-full flex items-center justify-between cursor-pointer bg-transparent border-none outline-none"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-100">FIIs</h2>
            <span className="text-xs text-slate-500 ml-1">
              ({filteredFiis.length} ativos)
            </span>
          </div>
          <span className="text-slate-400 transition-transform duration-200">
            {showFiis ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showFiis ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Ticker
                  </th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Nome
                  </th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Setor
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Qtd
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    PM
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Atual
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Rent. %
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Lucro/Prej.
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    P/VP
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    DY 12m
                  </th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium">
                    Ult. Div.
                  </th>
                </tr>
              </thead>
              <tbody>
                {fiiRows.map((row) => (
                  <tr
                    key={row.ticker}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-2 text-sm font-bold text-slate-100">
                      {row.ticker}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              SECTOR_COLORS[row.sector] || '#8b5cf6',
                          }}
                        />
                        {row.sector}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums">
                      {row.qty}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap">
                      {formatBRL(row.avgPrice)}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-100 text-right tabular-nums whitespace-nowrap">
                      {formatBRL(row.currentPrice)}
                    </td>
                    <td
                      className={`py-3 px-2 text-sm text-right tabular-nums font-medium ${colorClass(
                        row.ret,
                      )}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {row.ret >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {formatPct(row.ret)}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-2 text-sm text-right tabular-nums whitespace-nowrap font-medium ${colorClass(
                        row.profitLoss,
                      )}`}
                    >
                      {formatBRL(row.profitLoss)}
                    </td>
                    <td
                      className={`py-3 px-2 text-sm text-right tabular-nums font-medium ${
                        row.pvp < 1
                          ? 'text-emerald-400'
                          : row.pvp > 1.1
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {row.pvp.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-2 text-sm text-emerald-400 text-right tabular-nums font-medium">
                      {row.dy12m.toFixed(1).replace('.', ',')}%
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap">
                      {formatBRL(row.lastDividend)}
                    </td>
                  </tr>
                ))}

                {/* ---- Totals row ---- */}
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td
                    colSpan={3}
                    className="py-3 px-2 text-sm font-bold text-slate-100"
                  >
                    Total
                  </td>
                  <td className="py-3 px-2" />
                  <td className="py-3 px-2 text-sm text-slate-300 text-right tabular-nums whitespace-nowrap font-semibold">
                    {formatBRL(fiiTotals.totalCost)}
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-100 text-right tabular-nums whitespace-nowrap font-semibold">
                    {formatBRL(fiiTotals.totalPosition)}
                  </td>
                  <td
                    className={`py-3 px-2 text-sm text-right tabular-nums font-bold ${colorClass(
                      fiiTotals.totalRet,
                    )}`}
                  >
                    {formatPct(fiiTotals.totalRet)}
                  </td>
                  <td
                    className={`py-3 px-2 text-sm text-right tabular-nums whitespace-nowrap font-bold ${colorClass(
                      fiiTotals.totalProfitLoss,
                    )}`}
                  >
                    {formatBRL(fiiTotals.totalProfitLoss)}
                  </td>
                  <td colSpan={3} className="py-3 px-2" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTOR PIE CHART                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="glass-card p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Distribuicao por Setor
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Chart */}
          <div className="w-full lg:w-1/2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {sectorData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SECTOR_COLORS[entry.name] || '#6366f1'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sectorData.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-white/[0.03]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        SECTOR_COLORS[entry.name] || '#6366f1',
                    }}
                  />
                  <span className="text-sm text-slate-300 truncate">
                    {entry.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-100">
                    {entry.pct.toFixed(1).replace('.', ',')}%
                  </span>
                  <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                    {formatBRL(entry.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default BrStocksTab;
