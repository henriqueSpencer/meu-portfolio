import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Plus } from 'lucide-react';
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
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

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

const EMPTY_STOCK = {
  ticker: '', name: '', sector: '', qty: '', avgPrice: '', currentPrice: '',
  lpa: '', vpa: '', dividends5y: '', fairPriceManual: '', broker: '',
};

const EMPTY_FII = {
  ticker: '', name: '', sector: '', qty: '', avgPrice: '', currentPrice: '',
  pvp: '', dy12m: '', lastDividend: '', broker: '',
};

function BrStocksTab() {
  const { brStocks, setBrStocks, fiis, setFiis, currency, exchangeRate, brokerFilter } = useApp();

  const [showStocks, setShowStocks] = useState(true);
  const [showFiis, setShowFiis] = useState(true);

  // ---- Stock CRUD state ----
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK);

  // ---- FII CRUD state ----
  const [fiiModalOpen, setFiiModalOpen] = useState(false);
  const [editingFii, setEditingFii] = useState(null);
  const [fiiForm, setFiiForm] = useState(EMPTY_FII);

  // ---- Stock CRUD handlers ----
  function handleAddStock(e) {
    e.stopPropagation();
    setEditingStock(null);
    setStockForm(EMPTY_STOCK);
    setStockModalOpen(true);
  }

  function handleEditStock(stock) {
    setEditingStock(stock);
    setStockForm({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      qty: String(stock.qty),
      avgPrice: String(stock.avgPrice),
      currentPrice: String(stock.currentPrice),
      lpa: String(stock.lpa ?? ''),
      vpa: String(stock.vpa ?? ''),
      dividends5y: Array.isArray(stock.dividends5y) ? stock.dividends5y.join(', ') : '',
      fairPriceManual: stock.fairPriceManual ? String(stock.fairPriceManual) : '',
      broker: stock.broker || '',
    });
    setStockModalOpen(true);
  }

  function handleSaveStock() {
    const parsed = {
      ticker: stockForm.ticker.toUpperCase().trim(),
      name: stockForm.name.trim(),
      sector: stockForm.sector.trim(),
      qty: Number(stockForm.qty) || 0,
      avgPrice: Number(stockForm.avgPrice) || 0,
      currentPrice: Number(stockForm.currentPrice) || 0,
      lpa: stockForm.lpa !== '' ? Number(stockForm.lpa) : null,
      vpa: stockForm.vpa !== '' ? Number(stockForm.vpa) : null,
      dividends5y: stockForm.dividends5y
        ? stockForm.dividends5y.split(',').map((v) => Number(v.trim())).filter((v) => !isNaN(v))
        : [],
      fairPriceManual: stockForm.fairPriceManual ? Number(stockForm.fairPriceManual) : null,
      broker: stockForm.broker.trim(),
    };
    if (!parsed.ticker) return;
    if (editingStock) {
      setBrStocks((prev) => prev.map((s) => (s.ticker === editingStock.ticker ? parsed : s)));
    } else {
      setBrStocks((prev) => [...prev, parsed]);
    }
    setStockModalOpen(false);
  }

  function handleDeleteStock() {
    if (!editingStock) return;
    setBrStocks((prev) => prev.filter((s) => s.ticker !== editingStock.ticker));
    setStockModalOpen(false);
  }

  // ---- FII CRUD handlers ----
  function handleAddFii(e) {
    e.stopPropagation();
    setEditingFii(null);
    setFiiForm(EMPTY_FII);
    setFiiModalOpen(true);
  }

  function handleEditFii(fii) {
    setEditingFii(fii);
    setFiiForm({
      ticker: fii.ticker,
      name: fii.name,
      sector: fii.sector,
      qty: String(fii.qty),
      avgPrice: String(fii.avgPrice),
      currentPrice: String(fii.currentPrice),
      pvp: String(fii.pvp ?? ''),
      dy12m: String(fii.dy12m ?? ''),
      lastDividend: String(fii.lastDividend ?? ''),
      broker: fii.broker || '',
    });
    setFiiModalOpen(true);
  }

  function handleSaveFii() {
    const parsed = {
      ticker: fiiForm.ticker.toUpperCase().trim(),
      name: fiiForm.name.trim(),
      sector: fiiForm.sector.trim(),
      qty: Number(fiiForm.qty) || 0,
      avgPrice: Number(fiiForm.avgPrice) || 0,
      currentPrice: Number(fiiForm.currentPrice) || 0,
      pvp: fiiForm.pvp !== '' ? Number(fiiForm.pvp) : 0,
      dy12m: fiiForm.dy12m !== '' ? Number(fiiForm.dy12m) : 0,
      lastDividend: fiiForm.lastDividend !== '' ? Number(fiiForm.lastDividend) : 0,
      broker: fiiForm.broker.trim(),
    };
    if (!parsed.ticker) return;
    if (editingFii) {
      setFiis((prev) => prev.map((f) => (f.ticker === editingFii.ticker ? parsed : f)));
    } else {
      setFiis((prev) => [...prev, parsed]);
    }
    setFiiModalOpen(false);
  }

  function handleDeleteFii() {
    if (!editingFii) return;
    setFiis((prev) => prev.filter((f) => f.ticker !== editingFii.ticker));
    setFiiModalOpen(false);
  }

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
            <button
              onClick={handleAddStock}
              className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Acao
            </button>
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
                    onClick={() => handleEditStock(row)}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
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
            <button
              onClick={handleAddFii}
              className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar FII
            </button>
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
                    onClick={() => handleEditFii(row)}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
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
      {/* ---- Stock Modal ---- */}
      <FormModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={editingStock ? `Editar ${editingStock.ticker}` : 'Adicionar Acao'}
        onSave={handleSaveStock}
        onDelete={editingStock ? handleDeleteStock : undefined}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ticker">
            <FormInput value={stockForm.ticker} onChange={(e) => setStockForm((f) => ({ ...f, ticker: e.target.value }))} placeholder="PETR4" />
          </FormField>
          <FormField label="Corretora">
            <FormInput value={stockForm.broker} onChange={(e) => setStockForm((f) => ({ ...f, broker: e.target.value }))} placeholder="BTG" />
          </FormField>
        </div>
        <FormField label="Nome">
          <FormInput value={stockForm.name} onChange={(e) => setStockForm((f) => ({ ...f, name: e.target.value }))} placeholder="Petrobras PN" />
        </FormField>
        <FormField label="Setor">
          <FormInput value={stockForm.sector} onChange={(e) => setStockForm((f) => ({ ...f, sector: e.target.value }))} placeholder="Petroleo e Gas" />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Qtd">
            <FormInput type="number" value={stockForm.qty} onChange={(e) => setStockForm((f) => ({ ...f, qty: e.target.value }))} />
          </FormField>
          <FormField label="Preco Medio">
            <FormInput type="number" step="0.01" value={stockForm.avgPrice} onChange={(e) => setStockForm((f) => ({ ...f, avgPrice: e.target.value }))} />
          </FormField>
          <FormField label="Preco Atual">
            <FormInput type="number" step="0.01" value={stockForm.currentPrice} onChange={(e) => setStockForm((f) => ({ ...f, currentPrice: e.target.value }))} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="LPA">
            <FormInput type="number" step="0.01" value={stockForm.lpa} onChange={(e) => setStockForm((f) => ({ ...f, lpa: e.target.value }))} />
          </FormField>
          <FormField label="VPA">
            <FormInput type="number" step="0.01" value={stockForm.vpa} onChange={(e) => setStockForm((f) => ({ ...f, vpa: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Dividendos 5a (separados por virgula)">
          <FormInput value={stockForm.dividends5y} onChange={(e) => setStockForm((f) => ({ ...f, dividends5y: e.target.value }))} placeholder="3.80, 4.20, 3.50, 5.10, 4.60" />
        </FormField>
        <FormField label="Preco Justo Manual">
          <FormInput type="number" step="0.01" value={stockForm.fairPriceManual} onChange={(e) => setStockForm((f) => ({ ...f, fairPriceManual: e.target.value }))} />
        </FormField>
      </FormModal>

      {/* ---- FII Modal ---- */}
      <FormModal
        isOpen={fiiModalOpen}
        onClose={() => setFiiModalOpen(false)}
        title={editingFii ? `Editar ${editingFii.ticker}` : 'Adicionar FII'}
        onSave={handleSaveFii}
        onDelete={editingFii ? handleDeleteFii : undefined}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ticker">
            <FormInput value={fiiForm.ticker} onChange={(e) => setFiiForm((f) => ({ ...f, ticker: e.target.value }))} placeholder="HGLG11" />
          </FormField>
          <FormField label="Corretora">
            <FormInput value={fiiForm.broker} onChange={(e) => setFiiForm((f) => ({ ...f, broker: e.target.value }))} placeholder="BTG" />
          </FormField>
        </div>
        <FormField label="Nome">
          <FormInput value={fiiForm.name} onChange={(e) => setFiiForm((f) => ({ ...f, name: e.target.value }))} placeholder="CSHG Logistica FII" />
        </FormField>
        <FormField label="Setor">
          <FormInput value={fiiForm.sector} onChange={(e) => setFiiForm((f) => ({ ...f, sector: e.target.value }))} placeholder="Logistica" />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Qtd">
            <FormInput type="number" value={fiiForm.qty} onChange={(e) => setFiiForm((f) => ({ ...f, qty: e.target.value }))} />
          </FormField>
          <FormField label="Preco Medio">
            <FormInput type="number" step="0.01" value={fiiForm.avgPrice} onChange={(e) => setFiiForm((f) => ({ ...f, avgPrice: e.target.value }))} />
          </FormField>
          <FormField label="Preco Atual">
            <FormInput type="number" step="0.01" value={fiiForm.currentPrice} onChange={(e) => setFiiForm((f) => ({ ...f, currentPrice: e.target.value }))} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="P/VP">
            <FormInput type="number" step="0.01" value={fiiForm.pvp} onChange={(e) => setFiiForm((f) => ({ ...f, pvp: e.target.value }))} />
          </FormField>
          <FormField label="DY 12m (%)">
            <FormInput type="number" step="0.1" value={fiiForm.dy12m} onChange={(e) => setFiiForm((f) => ({ ...f, dy12m: e.target.value }))} />
          </FormField>
          <FormField label="Ult. Dividendo">
            <FormInput type="number" step="0.01" value={fiiForm.lastDividend} onChange={(e) => setFiiForm((f) => ({ ...f, lastDividend: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

export default BrStocksTab;
