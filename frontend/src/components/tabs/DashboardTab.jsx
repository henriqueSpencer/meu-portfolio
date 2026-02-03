import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatUSD,
  formatCurrency,
  formatPct,
  formatCompact,
  colorClass,
} from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Bell,
  BarChart3,
} from 'lucide-react';
import { CHART_COLORS } from '../../data/mockData';

// ---------------------------------------------------------------------------
// Shared glass-card style token (keeps the JSX readable)
// ---------------------------------------------------------------------------
const GLASS =
  'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

// ---------------------------------------------------------------------------
// Custom Recharts tooltip for the donut chart
// ---------------------------------------------------------------------------
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, pct } = payload[0].payload;
  return (
    <div className={`${GLASS} px-3 py-2 text-xs shadow-lg`}>
      <p className="font-medium text-slate-200">{name}</p>
      <p className="text-slate-400">
        {formatBRL(value)} &middot; {pct.toFixed(1)}%
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom label renderer for pie slices
// ---------------------------------------------------------------------------
function renderDonutLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  pct,
}) {
  if (pct < 3) return null; // hide tiny slices
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 24;
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
      {name} {pct.toFixed(1)}%
    </text>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DashboardTab() {
  const {
    currency,
    exchangeRate,
    allocation,
    totalPatrimony,
    dividendsSummary,
    watchlistAlerts,
    benchmarks,
    realAssets,
  } = useApp();

  // ---- Derived values -----------------------------------------------------
  const financialTotal = allocation.total;

  const immobilizedTotal = useMemo(
    () =>
      realAssets
        .filter((a) => a.includeInTotal)
        .reduce((sum, a) => sum + a.estimatedValue, 0),
    [realAssets],
  );

  // Mock month / year returns (as specified)
  const monthReturn = 2.43;
  const yearReturn = 13.0;

  // Donut chart data -- filter out zero-value classes so we get no empty slices
  const donutData = useMemo(
    () =>
      allocation.classes
        .filter((c) => c.value > 0)
        .map((c) => ({ name: c.class, value: c.value, pct: c.pct })),
    [allocation.classes],
  );

  // Summary stat cards configuration
  const summaryCards = [
    {
      label: 'Retorno Mensal',
      value: formatPct(monthReturn),
      raw: monthReturn,
      icon: TrendingUp,
    },
    {
      label: 'Retorno Anual',
      value: formatPct(yearReturn),
      raw: yearReturn,
      icon: BarChart3,
    },
    {
      label: 'Proventos (Mes)',
      value: formatCurrency(dividendsSummary.monthTotal, currency, exchangeRate),
      raw: dividendsSummary.monthTotal,
      icon: DollarSign,
    },
    {
      label: 'Proventos (Ano)',
      value: formatCurrency(dividendsSummary.yearTotal, currency, exchangeRate),
      raw: dividendsSummary.yearTotal,
      icon: DollarSign,
    },
  ];

  // Benchmark cards configuration
  const benchmarkCards = [
    { name: 'CDI', ytd: benchmarks.cdi?.ytd ?? 0 },
    { name: 'IBOV', ytd: benchmarks.ibov?.ytd ?? 0 },
    { name: 'IPCA+6%', ytd: benchmarks.ipca6?.ytd ?? 0 },
    { name: 'S&P 500', ytd: benchmarks.sp500?.ytd ?? 0 },
  ];

  // ---- Render -------------------------------------------------------------
  return (
    <section className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Total Patrimony Card                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className={`${GLASS} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
            <PieChartIcon size={20} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Patrimonio Total
            </p>
            <h2 className="text-3xl font-bold text-white">
              {formatCurrency(totalPatrimony, currency, exchangeRate)}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={`${GLASS} p-4`}>
            <p className="mb-1 text-xs text-slate-400">Ativos Financeiros</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(financialTotal, currency, exchangeRate)}
            </p>
          </div>
          <div className={`${GLASS} p-4`}>
            <p className="mb-1 text-xs text-slate-400">Ativos Imobilizados</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(immobilizedTotal, currency, exchangeRate)}
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Summary Stats Cards                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const positive = card.raw >= 0;
          return (
            <div key={card.label} className={`${GLASS} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {card.label}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    positive ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}
                >
                  <Icon
                    size={16}
                    className={positive ? 'text-emerald-400' : 'text-red-400'}
                  />
                </div>
              </div>
              <p
                className={`text-xl font-bold ${
                  positive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Benchmark Comparison Cards                                     */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Benchmarks (YTD)
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {benchmarkCards.map((b) => (
            <div key={b.name} className={`${GLASS} p-4 text-center`}>
              <p className="mb-1 text-xs font-medium text-slate-400">
                {b.name}
              </p>
              <p className={`text-lg font-bold ${colorClass(b.ytd)}`}>
                {formatPct(b.ytd)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Donut Chart + 5. Watchlist Alerts (side by side on desktop)     */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className={`${GLASS} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-violet-400" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Alocacao por Classe
            </h3>
          </div>

          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={renderDonutLabel}
                  labelLine={false}
                  stroke="none"
                >
                  {donutData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
              Sem dados de alocacao
            </div>
          )}

          {/* Legend below the chart */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {donutData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
                <span className="text-slate-300">
                  {entry.name}{' '}
                  <span className="text-slate-500">
                    ({entry.pct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist Alerts */}
        {watchlistAlerts.length > 0 && (
          <div
            className={`${GLASS} border-yellow-500/40 p-6`}
            style={{ borderColor: 'rgba(234,179,8,0.4)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Bell size={18} className="text-yellow-400" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-yellow-400">
                Alertas Watchlist
              </h3>
            </div>

            <ul className="space-y-3">
              {watchlistAlerts.map((alert) => (
                <li
                  key={alert.ticker}
                  className={`${GLASS} flex items-center justify-between p-4`}
                >
                  <div>
                    <p className="font-semibold text-white">{alert.ticker}</p>
                    <p className="text-xs text-slate-400">{alert.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-400">
                      Alvo: {formatBRL(alert.targetPrice)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Atual: {formatBRL(alert.currentPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
