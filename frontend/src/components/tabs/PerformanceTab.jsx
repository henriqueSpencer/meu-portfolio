import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatCurrency,
  formatPct,
  formatCompact,
  colorClass,
} from '../../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';

// ---------------------------------------------------------------------------
// Period filter configuration
// ---------------------------------------------------------------------------
const PERIODS = [
  { key: 'month', label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year', label: 'Ano' },
  { key: 'sinceStart', label: 'Desde o Inicio' },
];

// Maps our period keys to the benchmark object keys from mockData
const BENCHMARK_KEY_MAP = {
  month: 'month',
  quarter: 'ytd',      // closest available
  year: 'year',
  sinceStart: 'sinceStart',
};

// ---------------------------------------------------------------------------
// Mock return-by-asset-class data
// ---------------------------------------------------------------------------
const ASSET_CLASS_RETURNS = [
  { name: 'RV Brasil', returnPct: 15.2 },
  { name: 'FIIs', returnPct: -1.5 },
  { name: 'RV Exterior', returnPct: 22.8 },
  { name: 'Renda Fixa', returnPct: 10.5 },
];

// ---------------------------------------------------------------------------
// Line colors for benchmark comparison chart
// ---------------------------------------------------------------------------
const LINE_COLORS = {
  portfolio: '#6366f1',
  cdi: '#10b981',
  ibov: '#f59e0b',
  ipca6: '#8b5cf6',
  sp500: '#22d3ee',
};

// ---------------------------------------------------------------------------
// Custom tooltip for the evolution chart
// ---------------------------------------------------------------------------
function EvolutionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm shadow-lg">
      <p className="text-slate-200 font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {formatBRL(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for the benchmark comparison chart
// ---------------------------------------------------------------------------
function BenchmarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm shadow-lg">
      <p className="text-slate-200 font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PerformanceTab() {
  const {
    patrimonialHistory,
    benchmarks,
    allocation,
    currency,
    exchangeRate,
  } = useApp();

  const [activePeriod, setActivePeriod] = useState('sinceStart');

  // ---- Derived: slice history based on selected period --------------------
  const filteredHistory = useMemo(() => {
    if (!patrimonialHistory || patrimonialHistory.length === 0) return [];
    const len = patrimonialHistory.length;
    switch (activePeriod) {
      case 'month':
        return patrimonialHistory.slice(Math.max(0, len - 2));
      case 'quarter':
        return patrimonialHistory.slice(Math.max(0, len - 4));
      case 'year':
        return patrimonialHistory.slice(Math.max(0, len - 13));
      case 'sinceStart':
      default:
        return patrimonialHistory;
    }
  }, [patrimonialHistory, activePeriod]);

  // ---- Derived: portfolio return for the selected period ------------------
  const portfolioReturn = useMemo(() => {
    if (filteredHistory.length < 2) return 0;
    const first = filteredHistory[0].total;
    const last = filteredHistory[filteredHistory.length - 1].total;
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [filteredHistory]);

  // ---- Derived: benchmark returns for the selected period -----------------
  const benchmarkKey = BENCHMARK_KEY_MAP[activePeriod];

  const benchmarkReturns = useMemo(
    () => ({
      cdi: benchmarks?.cdi?.[benchmarkKey] ?? 0,
      ibov: benchmarks?.ibov?.[benchmarkKey] ?? 0,
      ipca6: benchmarks?.ipca6?.[benchmarkKey] ?? 0,
      sp500: benchmarks?.sp500?.[benchmarkKey] ?? 0,
    }),
    [benchmarks, benchmarkKey],
  );

  // ---- Derived: normalized benchmark data for comparison chart ------------
  const normalizedData = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return [];
    const firstTotal = filteredHistory[0].total;
    return filteredHistory.map((entry) => ({
      month: entry.month,
      'Meu Portfolio': firstTotal > 0
        ? parseFloat(((entry.total / firstTotal) * 100).toFixed(2))
        : 100,
      CDI: entry.cdi,
      IBOV: entry.ibov,
      'IPCA+6%': entry.ipca6,
      'S&P500': entry.sp500,
    }));
  }, [filteredHistory]);

  // ---- Derived: asset class return table rows -----------------------------
  const assetClassRows = useMemo(() => {
    const total = allocation?.total || 1;
    return ASSET_CLASS_RETURNS.map((ac) => {
      const match = allocation?.classes?.find((c) => c.class === ac.name);
      const currentValue = match?.value ?? 0;
      const weight = total > 0 ? (currentValue / total) * 100 : 0;
      const contribution = (ac.returnPct * weight) / 100;
      return {
        ...ac,
        currentValue,
        weight,
        contribution,
      };
    });
  }, [allocation]);

  // ---- Summary cards config -----------------------------------------------
  const summaryCards = [
    {
      label: 'Meu Portfolio',
      value: portfolioReturn,
      benchmark: null,
      icon: TrendingUp,
      accent: 'indigo',
    },
    {
      label: 'vs CDI',
      value: benchmarkReturns.cdi,
      diff: portfolioReturn - benchmarkReturns.cdi,
      icon: BarChart3,
      accent: 'emerald',
    },
    {
      label: 'vs IBOV',
      value: benchmarkReturns.ibov,
      diff: portfolioReturn - benchmarkReturns.ibov,
      icon: BarChart3,
      accent: 'amber',
    },
    {
      label: 'vs S&P500',
      value: benchmarkReturns.sp500,
      diff: portfolioReturn - benchmarkReturns.sp500,
      icon: BarChart3,
      accent: 'cyan',
    },
  ];

  // ---- Render -------------------------------------------------------------
  return (
    <section className="space-y-6">
      {/* ================================================================= */}
      {/* 1. Header + Period Filter                                         */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
            <TrendingUp size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Rentabilidade
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhe o desempenho do seu portfolio
            </p>
          </div>
        </div>

        {/* Segmented control / pill buttons */}
        <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePeriod(p.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                activePeriod === p.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. Return Summary Cards                                           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const positive = card.value >= 0;
          return (
            <div key={card.label} className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
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

              <p className={`text-2xl font-bold ${colorClass(card.value)}`}>
                {formatPct(card.value)}
              </p>

              {card.diff != null && (
                <p className="mt-1 text-xs text-slate-400">
                  vs CDI:{' '}
                  <span className={colorClass(card.diff)}>
                    {card.diff >= 0 ? '+' : ''}
                    {card.diff.toFixed(1).replace('.', ',')}pp
                  </span>
                </p>
              )}

              {card.label === 'Meu Portfolio' && (
                <p className="mt-1 text-xs text-slate-400">
                  {PERIODS.find((p) => p.key === activePeriod)?.label}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 3. Portfolio Evolution Chart (Area/Line)                          */}
      {/* ================================================================= */}
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Evolucao Patrimonial
          </h3>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredHistory}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradientPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                tickFormatter={(v) => formatCompact(v)}
                domain={['dataMin - 10000', 'dataMax + 10000']}
              />
              <Tooltip
                content={<EvolutionTooltip />}
                cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Portfolio"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#gradientPortfolio)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0b0f1a' }}
                activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 2, stroke: '#0b0f1a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. Benchmark Comparison Chart (normalized to 100)                 */}
      {/* ================================================================= */}
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-violet-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Comparativo com Benchmarks (base 100)
          </h3>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={normalizedData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
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
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <Tooltip
                content={<BenchmarkTooltip />}
                cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => (
                  <span className="text-slate-300 text-sm">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="Meu Portfolio"
                stroke={LINE_COLORS.portfolio}
                strokeWidth={2.5}
                dot={{ r: 4, fill: LINE_COLORS.portfolio, strokeWidth: 2, stroke: '#0b0f1a' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="CDI"
                stroke={LINE_COLORS.cdi}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_COLORS.cdi, strokeWidth: 2, stroke: '#0b0f1a' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="IBOV"
                stroke={LINE_COLORS.ibov}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_COLORS.ibov, strokeWidth: 2, stroke: '#0b0f1a' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="IPCA+6%"
                stroke={LINE_COLORS.ipca6}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_COLORS.ipca6, strokeWidth: 2, stroke: '#0b0f1a' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="S&P500"
                stroke={LINE_COLORS.sp500}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_COLORS.sp500, strokeWidth: 2, stroke: '#0b0f1a' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. Return by Asset Class Table                                    */}
      {/* ================================================================= */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Rentabilidade por Classe de Ativo
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 font-medium px-6 py-3">
                  Classe
                </th>
                <th className="text-right text-slate-400 font-medium px-6 py-3">
                  Valor Atual
                </th>
                <th className="text-right text-slate-400 font-medium px-6 py-3">
                  Retorno (%)
                </th>
                <th className="text-right text-slate-400 font-medium px-6 py-3">
                  Peso (%)
                </th>
                <th className="text-right text-slate-400 font-medium px-6 py-3">
                  Contribuicao
                </th>
              </tr>
            </thead>
            <tbody>
              {assetClassRows.map((row, idx) => (
                <tr
                  key={row.name}
                  className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                    idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <span className="text-slate-200 font-medium">
                      {row.name}
                    </span>
                  </td>
                  <td className="text-right px-6 py-3.5 text-slate-300">
                    {formatCurrency(row.currentValue, currency, exchangeRate)}
                  </td>
                  <td
                    className={`text-right px-6 py-3.5 font-semibold ${colorClass(
                      row.returnPct,
                    )}`}
                  >
                    {formatPct(row.returnPct)}
                  </td>
                  <td className="text-right px-6 py-3.5 text-slate-400">
                    {row.weight.toFixed(1).replace('.', ',')}%
                  </td>
                  <td
                    className={`text-right px-6 py-3.5 font-medium ${colorClass(
                      row.contribution,
                    )}`}
                  >
                    {row.contribution >= 0 ? '+' : ''}
                    {row.contribution.toFixed(2).replace('.', ',')}pp
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer total row */}
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.03]">
                <td className="px-6 py-3.5 text-slate-200 font-semibold">
                  Total
                </td>
                <td className="text-right px-6 py-3.5 text-slate-200 font-semibold">
                  {formatCurrency(allocation?.total || 0, currency, exchangeRate)}
                </td>
                <td
                  className={`text-right px-6 py-3.5 font-bold ${colorClass(
                    portfolioReturn,
                  )}`}
                >
                  {formatPct(portfolioReturn)}
                </td>
                <td className="text-right px-6 py-3.5 text-slate-400 font-medium">
                  100,0%
                </td>
                <td
                  className={`text-right px-6 py-3.5 font-bold ${colorClass(
                    assetClassRows.reduce((sum, r) => sum + r.contribution, 0),
                  )}`}
                >
                  {(() => {
                    const total = assetClassRows.reduce(
                      (sum, r) => sum + r.contribution,
                      0,
                    );
                    return `${total >= 0 ? '+' : ''}${total
                      .toFixed(2)
                      .replace('.', ',')}pp`;
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
