import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPctUnsigned, formatPct } from '../../utils/formatters';
import { CHART_COLORS } from '../../data/mockData';
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
import {
  Target,
  Edit3,
  X,
  Check,
  TrendingUp,
  Building2,
  Globe,
  Shield,
  Wallet,
  Bitcoin,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Icon resolver -- maps the string stored in targets to a Lucide component
// ---------------------------------------------------------------------------
const ICON_MAP = {
  TrendingUp,
  Building2,
  Globe,
  Shield,
  Wallet,
  Bitcoin,
};

function ClassIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICON_MAP[name] || Target;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------------------
// Custom Recharts tooltip for the bar chart
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm">
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
export default function AllocationTab() {
  const { allocation, targets, setTargets, currency, exchangeRate } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const [validationError, setValidationError] = useState('');

  // ------- Derived table rows -------
  const rows = targets.map((t) => {
    const match = allocation.classes.find((c) => c.class === t.class) || {
      value: 0,
      pct: 0,
    };
    const diff = match.pct - t.target;
    return {
      className: t.class,
      icon: t.icon,
      currentPct: match.pct,
      targetPct: t.target,
      diff,
      value: match.value,
    };
  });

  // ------- Chart data -------
  const chartData = rows.map((r) => ({
    name: r.className,
    Atual: parseFloat(r.currentPct.toFixed(2)),
    Meta: parseFloat(r.targetPct.toFixed(2)),
  }));

  // ------- Modal helpers -------
  function openModal() {
    setDraft(targets.map((t) => ({ ...t })));
    setValidationError('');
    setIsOpen(true);
  }

  function handleDraftChange(index, value) {
    const next = [...draft];
    next[index] = { ...next[index], target: value };
    setDraft(next);
    setValidationError('');
  }

  function saveTargets() {
    const total = draft.reduce((sum, d) => sum + Number(d.target), 0);
    if (Math.abs(total - 100) > 0.01) {
      setValidationError(
        `A soma das metas deve ser 100%. Atualmente: ${total.toFixed(1)}%`,
      );
      return;
    }
    setTargets(draft.map((d) => ({ ...d, target: Number(d.target) })));
    setIsOpen(false);
  }

  const draftTotal = draft.reduce((sum, d) => sum + Number(d.target || 0), 0);

  // ------- Render -------
  return (
    <div className="space-y-6">
      {/* ============== Header ============== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-semibold text-slate-100">
            Alocacao &amp; Metas
          </h2>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors text-sm font-medium"
        >
          <Edit3 className="w-4 h-4" />
          Editar Metas
        </button>
      </div>

      {/* ============== Table ============== */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 font-medium px-5 py-3">
                  Classe
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Atual %
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Meta %
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Diferenca
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Valor Atual
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const diffColor =
                  row.diff >= 0 ? 'text-emerald-400' : 'text-red-400';
                return (
                  <tr
                    key={row.className}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                      idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-400">
                          <ClassIcon name={row.icon} className="w-5 h-5" />
                        </span>
                        <span className="text-slate-200 font-medium">
                          {row.className}
                        </span>
                      </div>
                    </td>
                    <td className="text-right px-5 py-3.5 text-slate-300">
                      {formatPctUnsigned(row.currentPct)}
                    </td>
                    <td className="text-right px-5 py-3.5 text-slate-300">
                      {formatPctUnsigned(row.targetPct)}
                    </td>
                    <td className={`text-right px-5 py-3.5 font-medium ${diffColor}`}>
                      {formatPct(row.diff)}
                    </td>
                    <td className="text-right px-5 py-3.5 text-slate-200">
                      {formatCurrency(row.value, currency, exchangeRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============== Bar Chart ============== */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-slate-200 mb-4">
          Atual vs Meta por Classe
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
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
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-slate-300 text-sm">{value}</span>
                )}
              />
              <Bar
                dataKey="Atual"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <Bar
                dataKey="Meta"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============== Edit Goals Modal ============== */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <div
            className="glass-card relative z-10 w-full max-w-lg mx-4 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-slate-100">
                  Editar Metas de Alocacao
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 mb-6">
              {draft.map((item, idx) => (
                <div
                  key={item.class}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
                >
                  <span className="text-indigo-400">
                    <ClassIcon name={item.icon} className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-sm text-slate-200 font-medium">
                    {item.class}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.target}
                      onChange={(e) => handleDraftChange(idx, e.target.value)}
                      className="w-20 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-100 text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                    />
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total indicator */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 mb-4">
              <span className="text-sm text-slate-400 font-medium">Total</span>
              <span
                className={`text-sm font-semibold ${
                  Math.abs(draftTotal - 100) <= 0.01
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {draftTotal.toFixed(1).replace('.', ',')}%
              </span>
            </div>

            {/* Validation error */}
            {validationError && (
              <p className="text-red-400 text-sm mb-4 text-center">
                {validationError}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveTargets}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={Math.abs(draftTotal - 100) > 0.01}
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
