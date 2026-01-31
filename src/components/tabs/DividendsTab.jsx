import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatCurrency,
  formatDate,
  formatMonthYear,
} from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { CHART_COLORS } from '../../data/mockData';
import { yieldOnCost } from '../../utils/calculations';

// ---------------------------------------------------------------------------
// Shared glass-card style token
// ---------------------------------------------------------------------------
const GLASS =
  'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

// ---------------------------------------------------------------------------
// Portuguese month abbreviations for YYYY-MM -> "Mmm/YY" formatting
// ---------------------------------------------------------------------------
const MONTH_ABBR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function monthKeyToLabel(key) {
  const [year, month] = key.split('-');
  return `${MONTH_ABBR[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

// ---------------------------------------------------------------------------
// Custom tooltips
// ---------------------------------------------------------------------------
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${GLASS} px-4 py-3 text-sm shadow-lg`}>
      <p className="text-slate-200 font-medium mb-1">{label}</p>
      <p className="text-indigo-300">
        {formatBRL(payload[0].value)}
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { ticker, value, pct } = payload[0].payload;
  return (
    <div className={`${GLASS} px-3 py-2 text-xs shadow-lg`}>
      <p className="font-medium text-slate-200">{ticker}</p>
      <p className="text-slate-400">
        {formatBRL(value)} &middot; {pct.toFixed(1)}%
      </p>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${GLASS} px-4 py-3 text-sm shadow-lg`}>
      <p className="text-slate-200 font-medium mb-1">{label}</p>
      <p className="text-cyan-300">
        Acumulado: {formatBRL(payload[0].value)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pie chart outer label renderer
// ---------------------------------------------------------------------------
function renderPieLabel({ cx, cy, midAngle, outerRadius, ticker, pct }) {
  if (pct < 4) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#cbd5e1"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[11px]"
    >
      {ticker} {pct.toFixed(1)}%
    </text>
  );
}

// ---------------------------------------------------------------------------
// Summary card sub-component
// ---------------------------------------------------------------------------
function SummaryCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className={`${GLASS} p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DividendsTab() {
  const {
    dividends,
    brStocks,
    fiis,
    intlStocks,
    currency,
    exchangeRate,
  } = useApp();

  const [typeFilter, setTypeFilter] = useState('Todos');

  // ---- 1. Summary calculations -------------------------------------------
  const { monthTotal, yearTotal, allTimeTotal } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let month = 0;
    let year = 0;
    let all = 0;

    for (const d of dividends) {
      const dt = new Date(d.date + 'T00:00:00');
      all += d.value;
      if (dt.getFullYear() === currentYear) {
        year += d.value;
        if (dt.getMonth() === currentMonth) {
          month += d.value;
        }
      }
    }

    return { monthTotal: month, yearTotal: year, allTimeTotal: all };
  }, [dividends]);

  // ---- 2. Monthly bar chart data -----------------------------------------
  const monthlyData = useMemo(() => {
    const map = {};
    for (const d of dividends) {
      const key = d.date.slice(0, 7); // "YYYY-MM"
      map[key] = (map[key] || 0) + d.value;
    }
    return Object.keys(map)
      .sort()
      .map((key) => ({
        month: monthKeyToLabel(key),
        total: parseFloat(map[key].toFixed(2)),
      }));
  }, [dividends]);

  // ---- 3. Dividends by asset pie chart data ------------------------------
  const assetPieData = useMemo(() => {
    const map = {};
    for (const d of dividends) {
      map[d.ticker] = (map[d.ticker] || 0) + d.value;
    }
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([ticker, value]) => ({
        ticker,
        value: parseFloat(value.toFixed(2)),
        pct: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [dividends]);

  // ---- 4. Filtered & sorted history table data ---------------------------
  const filteredHistory = useMemo(() => {
    const base =
      typeFilter === 'Todos'
        ? [...dividends]
        : dividends.filter((d) => d.type === typeFilter);
    return base.sort(
      (a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'),
    );
  }, [dividends, typeFilter]);

  // ---- 5. Yield on Cost data ---------------------------------------------
  const yocData = useMemo(() => {
    // Build a combined lookup of all stocks with avgPrice
    const allAssets = [
      ...brStocks.map((s) => ({
        ticker: s.ticker,
        avgPrice: s.avgPrice,
        qty: s.qty,
      })),
      ...fiis.map((f) => ({
        ticker: f.ticker,
        avgPrice: f.avgPrice,
        qty: f.qty,
      })),
      ...intlStocks.map((s) => ({
        ticker: s.ticker,
        avgPrice: s.avgPriceUsd * exchangeRate,
        qty: s.qty,
      })),
    ];
    const assetMap = {};
    for (const a of allAssets) {
      assetMap[a.ticker] = a;
    }

    // Sum dividends per ticker
    const divMap = {};
    for (const d of dividends) {
      divMap[d.ticker] = (divMap[d.ticker] || 0) + d.value;
    }

    // Build rows only for tickers that paid dividends AND are in the portfolio
    const rows = [];
    for (const [ticker, totalDiv] of Object.entries(divMap)) {
      const asset = assetMap[ticker];
      if (!asset) continue;

      // Annualize: data spans ~6 months, so annualDividendPerShare estimate
      const dates = dividends
        .filter((d) => d.ticker === ticker)
        .map((d) => new Date(d.date + 'T00:00:00').getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const spanMonths = Math.max(
        1,
        (maxDate - minDate) / (1000 * 60 * 60 * 24 * 30),
      );
      const annualized = (totalDiv / spanMonths) * 12;
      const annualPerShare = asset.qty > 0 ? annualized / asset.qty : 0;
      const yoc = yieldOnCost(annualPerShare, asset.avgPrice);

      rows.push({
        ticker,
        totalDividends: totalDiv,
        avgPrice: asset.avgPrice,
        yoc,
      });
    }

    return rows.sort((a, b) => b.yoc - a.yoc);
  }, [dividends, brStocks, fiis, intlStocks, exchangeRate]);

  // ---- 6. Projection data ------------------------------------------------
  const projection = useMemo(() => {
    // Get unique months sorted, take last 6
    const monthMap = {};
    for (const d of dividends) {
      const key = d.date.slice(0, 7);
      monthMap[key] = (monthMap[key] || 0) + d.value;
    }
    const sorted = Object.keys(monthMap).sort();
    const last6 = sorted.slice(-6);
    const sum = last6.reduce((s, k) => s + monthMap[k], 0);
    const avg = last6.length > 0 ? sum / last6.length : 0;
    return {
      avgMonthly: avg,
      projectedAnnual: avg * 12,
    };
  }, [dividends]);

  // ---- 7. Cumulative monthly trend (for the line in the bar chart) -------
  const cumulativeData = useMemo(() => {
    let acc = 0;
    return monthlyData.map((item) => {
      acc += item.total;
      return { ...item, cumulative: parseFloat(acc.toFixed(2)) };
    });
  }, [monthlyData]);

  // ---- Render ------------------------------------------------------------
  return (
    <section className="space-y-6">
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
          <DollarSign size={22} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Proventos</h2>
          <p className="text-xs text-slate-500">
            Dividendos, JCP e Rendimentos
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. Summary Cards (3 cards)                                        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Proventos do Mes (Jan/26)"
          value={formatCurrency(monthTotal, currency, exchangeRate)}
          icon={Calendar}
          iconBg="bg-indigo-500/20"
          iconColor="text-indigo-400"
        />
        <SummaryCard
          label="Proventos do Ano (2026)"
          value={formatCurrency(yearTotal, currency, exchangeRate)}
          icon={TrendingUp}
          iconBg="bg-violet-500/20"
          iconColor="text-violet-400"
        />
        <SummaryCard
          label="Proventos Totais"
          value={formatCurrency(allTimeTotal, currency, exchangeRate)}
          icon={DollarSign}
          iconBg="bg-emerald-500/20"
          iconColor="text-emerald-400"
        />
      </div>

      {/* ================================================================= */}
      {/* Charts: 2-column grid on desktop                                  */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* -------------------------------------------------------------- */}
        {/* 2. Monthly Dividends Bar Chart (prominent - spans full width    */}
        {/*    on the left column, taller than the pie)                     */}
        {/* -------------------------------------------------------------- */}
        <div className={`${GLASS} p-6 lg:col-span-2`}>
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Proventos Mensais
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cumulativeData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="bar"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tickFormatter={(v) => formatBRL(v).replace('R$\u00a0', 'R$ ')}
                />
                <YAxis
                  yAxisId="line"
                  orientation="right"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tickFormatter={(v) => formatBRL(v).replace('R$\u00a0', 'R$ ')}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 12 }}
                  formatter={(value) => (
                    <span className="text-slate-300 text-sm">{value}</span>
                  )}
                />
                <Bar
                  yAxisId="bar"
                  dataKey="total"
                  name="Mensal"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                />
                <Line
                  yAxisId="line"
                  type="monotone"
                  dataKey="cumulative"
                  name="Acumulado"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* 3. Dividends by Asset Pie Chart                                 */}
        {/* -------------------------------------------------------------- */}
        <div className={`${GLASS} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-violet-400" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Proventos por Ativo
            </h3>
          </div>

          {assetPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="ticker"
                  label={renderPieLabel}
                  labelLine={false}
                  stroke="none"
                >
                  {assetPieData.map((entry, idx) => (
                    <Cell
                      key={entry.ticker}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
              Sem dados de proventos
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {assetPieData.map((entry, idx) => (
              <div key={entry.ticker} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
                <span className="text-slate-300">
                  {entry.ticker}{' '}
                  <span className="text-slate-500">
                    ({entry.pct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* 6. Projection Card                                              */}
        {/* -------------------------------------------------------------- */}
        <div className={`${GLASS} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-cyan-400" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Projecao de Proventos
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={`${GLASS} p-4`}>
              <p className="mb-1 text-xs text-slate-400">Media Mensal</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(projection.avgMonthly, currency, exchangeRate)}
              </p>
            </div>
            <div className={`${GLASS} p-4`}>
              <p className="mb-1 text-xs text-slate-400">Projecao Anual</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(projection.projectedAnnual, currency, exchangeRate)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 italic">
            Projecao baseada na media dos ultimos 6 meses
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. Dividends History Table                                        */}
      {/* ================================================================= */}
      <div className={`${GLASS} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Historico de Proventos
            </h3>
          </div>

          {/* Filter dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          >
            <option value="Todos" className="bg-slate-800">Todos</option>
            <option value="Dividendo" className="bg-slate-800">Dividendo</option>
            <option value="JCP" className="bg-slate-800">JCP</option>
            <option value="Rendimento" className="bg-slate-800">Rendimento</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 font-medium px-5 py-3">
                  Data
                </th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">
                  Ticker
                </th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">
                  Tipo
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((d, idx) => {
                const typeBadge = {
                  Dividendo: 'bg-emerald-500/15 text-emerald-400',
                  JCP: 'bg-amber-500/15 text-amber-400',
                  Rendimento: 'bg-indigo-500/15 text-indigo-400',
                };
                return (
                  <tr
                    key={`${d.date}-${d.ticker}-${idx}`}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                      idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-slate-300">
                      {formatDate(d.date)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-200">
                        {d.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          typeBadge[d.type] || 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-200 font-medium">
                      {formatCurrency(d.value, currency, exchangeRate)}
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum provento encontrado para o filtro selecionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. Yield on Cost Section                                          */}
      {/* ================================================================= */}
      <div className={`${GLASS} p-6`}>
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Yield on Cost
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {yocData.map((item) => {
            const yocColor =
              item.yoc >= 8
                ? 'text-emerald-400'
                : item.yoc >= 4
                ? 'text-amber-400'
                : 'text-slate-300';
            return (
              <div
                key={item.ticker}
                className={`${GLASS} p-4 hover:bg-white/[0.08] hover:border-indigo-500/30 transition-colors`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold text-white">
                    {item.ticker}
                  </span>
                  <span className={`text-lg font-bold ${yocColor}`}>
                    {item.yoc.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Recebido</span>
                    <span className="text-slate-300">
                      {formatCurrency(item.totalDividends, currency, exchangeRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preco Medio</span>
                    <span className="text-slate-300">
                      {formatBRL(item.avgPrice)}
                    </span>
                  </div>
                </div>
                {/* YoC bar indicator */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(item.yoc * 5, 100)}%`,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {yocData.length === 0 && (
            <p className="col-span-full text-center text-sm text-slate-500 py-4">
              Nenhum dado de Yield on Cost disponivel
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
