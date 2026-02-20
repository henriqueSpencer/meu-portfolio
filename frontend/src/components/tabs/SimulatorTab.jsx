import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { suggestAllocation } from '../../utils/calculations';
import { formatBRL, formatPctUnsigned } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calculator, ArrowRight, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Accent colours used in the suggestion cards' left-border
// ---------------------------------------------------------------------------
const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#22d3ee', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
];

// ---------------------------------------------------------------------------
// Custom Recharts tooltip for the before/after bar chart
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm shadow-lg">
      <p className="text-slate-200 font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(2).replace('.', ',')}%
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SimulatorTab() {
  const { allocation, targets } = useApp();

  // ---- Local state ----------------------------------------------------------
  const [inputAmount, setInputAmount] = useState(5000);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [simulatedAmount, setSimulatedAmount] = useState(0);

  // Suggestions produced by the algorithm
  const [suggestions, setSuggestions] = useState([]);

  // Manual adjustment amounts keyed by class name
  const [manualAmounts, setManualAmounts] = useState({});

  // ---- Run simulation -------------------------------------------------------
  function handleSimulate() {
    const amount = Number(inputAmount) || 0;
    if (amount <= 0) return;

    const result = suggestAllocation(amount, allocation.classes, targets, allocation.total);
    setSuggestions(result);
    setSimulatedAmount(amount);
    setHasSimulated(true);

    // Seed manual amounts from the algorithm output
    const initial = {};
    result.forEach((s) => {
      initial[s.class] = parseFloat(s.suggestedAmount.toFixed(2));
    });
    setManualAmounts(initial);
  }

  // ---- Reset simulation -----------------------------------------------------
  function handleReset() {
    setHasSimulated(false);
    setSuggestions([]);
    setManualAmounts({});
    setSimulatedAmount(0);
  }

  // ---- Manual adjustment handler --------------------------------------------
  function handleManualChange(className, value) {
    setManualAmounts((prev) => ({
      ...prev,
      [className]: value === '' ? '' : Number(value),
    }));
  }

  // ---- Derived: total of manual amounts & validation ------------------------
  const manualTotal = useMemo(() => {
    return Object.values(manualAmounts).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0,
    );
  }, [manualAmounts]);

  const isManualValid = useMemo(() => {
    return Math.abs(manualTotal - simulatedAmount) < 0.01;
  }, [manualTotal, simulatedAmount]);

  // ---- Derived: "after" allocation percentages using manual amounts ---------
  const chartData = useMemo(() => {
    if (!hasSimulated) return [];

    const currentTotal = allocation.total;
    const newTotal = currentTotal + simulatedAmount;

    return allocation.classes
      .filter((c) => c.value > 0 || (manualAmounts[c.class] != null && Number(manualAmounts[c.class]) > 0))
      .map((c) => {
        const addedAmount = Number(manualAmounts[c.class]) || 0;
        const afterValue = c.value + addedAmount;
        const afterPct = newTotal > 0 ? (afterValue / newTotal) * 100 : 0;

        return {
          name: c.class,
          'Atual %': parseFloat(c.pct.toFixed(2)),
          'Apos Aporte %': parseFloat(afterPct.toFixed(2)),
        };
      });
  }, [allocation, hasSimulated, simulatedAmount, manualAmounts]);

  // ---- Derived: summary text ------------------------------------------------
  const summaryText = useMemo(() => {
    if (suggestions.length === 0) return '';
    const parts = suggestions.map(
      (s) => `${formatBRL(s.suggestedAmount)} em ${s.class}`,
    );
    return `Sugestao: Aportar ${parts.join(' e ')}`;
  }, [suggestions]);

  // ---- Render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* Header                                                             */}
      {/* ================================================================== */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
          <Calculator size={20} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Simulador de Aporte
          </h2>
          <p className="text-xs text-slate-400">
            Simule o impacto de um novo aporte na sua alocacao
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 1. Input Section                                                   */}
      {/* ================================================================== */}
      <div className="glass-card p-6">
        <label
          htmlFor="contribution-amount"
          className="block text-sm font-medium text-slate-400 mb-3"
        >
          Valor do Aporte Mensal
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-medium select-none">
                R$
              </span>
              <input
                id="contribution-amount"
                type="number"
                min="0"
                step="100"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-dark-800 pl-12 pr-4 py-4 text-3xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                placeholder="5.000"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Calculator size={18} />
              Simular
            </button>

            {hasSimulated && (
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                title="Resetar simulacao"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Everything below is shown only after simulation                    */}
      {/* ================================================================== */}
      {hasSimulated && suggestions.length > 0 && (
        <>
          {/* ============================================================== */}
          {/* 2. Suggestion Section                                          */}
          {/* ============================================================== */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <ArrowRight size={18} className="text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-200">
                Sugestao de Alocacao do Aporte
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {suggestions.map((s, idx) => {
                const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                const deficit = s.target - s.current;

                return (
                  <div
                    key={s.class}
                    className="glass-card glass-card-hover p-5 transition-all"
                    style={{ borderLeft: `3px solid ${accentColor}` }}
                  >
                    {/* Class name */}
                    <h4 className="text-lg font-semibold text-white mb-3">
                      {s.class}
                    </h4>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                      <div>
                        <span className="text-slate-500">Atual</span>
                        <p className="text-slate-200 font-medium">
                          {formatPctUnsigned(s.current)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Meta</span>
                        <p className="text-slate-200 font-medium">
                          {formatPctUnsigned(s.target)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Deficit</span>
                        <p className="text-red-400 font-medium">
                          {formatPctUnsigned(deficit)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">% do Aporte</span>
                        <p className="font-medium" style={{ color: accentColor }}>
                          {formatPctUnsigned(s.suggestedPct)}
                        </p>
                      </div>
                    </div>

                    {/* Suggested amount */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">
                        Valor sugerido
                      </span>
                      <p
                        className="text-xl font-bold mt-0.5"
                        style={{ color: accentColor }}
                      >
                        {formatBRL(s.suggestedAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary line */}
            <div className="mt-5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 px-4 py-3">
              <p className="text-sm text-indigo-300 font-medium">
                {summaryText}
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. Before / After Visualization                                */}
          {/* ============================================================== */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1">
              Impacto na Alocacao
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Comparacao da distribuicao percentual antes e depois do aporte
            </p>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 12 }}
                    formatter={(value) => (
                      <span className="text-slate-300 text-sm">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="Atual %"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="Apos Aporte %"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 4. Manual Adjustment                                           */}
          {/* ============================================================== */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-200">
                  Ajuste Manual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edite os valores sugeridos. O grafico acima sera atualizado em
                  tempo real.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {suggestions.map((s, idx) => {
                const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                const currentVal = manualAmounts[s.class] ?? 0;

                return (
                  <div
                    key={s.class}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/5"
                  >
                    {/* Label */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-sm text-slate-200 font-medium truncate">
                        {s.class}
                      </span>
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={currentVal}
                        onChange={(e) =>
                          handleManualChange(s.class, e.target.value)
                        }
                        className="w-36 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 text-right font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total & validation */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400 font-medium">
                  Total ajustado
                </span>
                <span
                  className={`text-lg font-bold ${
                    isManualValid ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatBRL(manualTotal)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">Meta:</span>
                <span className="text-slate-300 font-medium">
                  {formatBRL(simulatedAmount)}
                </span>
              </div>
            </div>

            {!isManualValid && (
              <p className="mt-3 text-sm text-red-400 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                O total ajustado deve ser igual ao valor do aporte (
                {formatBRL(simulatedAmount)}). Diferenca:{' '}
                {formatBRL(Math.abs(manualTotal - simulatedAmount))}
              </p>
            )}

            {isManualValid && (
              <p className="mt-3 text-sm text-emerald-400 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Valores corretos. O aporte esta totalmente distribuido.
              </p>
            )}
          </div>
        </>
      )}

      {/* ================================================================== */}
      {/* Empty state when no simulation results & no classes with deficit   */}
      {/* ================================================================== */}
      {hasSimulated && suggestions.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Calculator size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            Todas as classes estao acima ou no alvo definido. Nenhuma sugestao de
            aporte no momento.
          </p>
        </div>
      )}
    </div>
  );
}
