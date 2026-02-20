import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatBRL, formatPctUnsigned, formatPct } from '../../utils/formatters';
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
  Info,
  Plus,
  Trash2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------
const ICON_MAP = { TrendingUp, Building2, Globe, Shield, Wallet };

function ClassIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICON_MAP[name] || Target;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------------------
// Custom Recharts tooltip
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
// Row tooltip showing calculation breakdown
// ---------------------------------------------------------------------------
function RowTooltip({ row }) {
  if (!row.tooltipText) return null;
  return (
    <div className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-2 w-72 glass-card px-4 py-3 text-xs shadow-xl pointer-events-none">
      <p className="text-slate-200 font-medium mb-1">{row.className}</p>
      <p className="text-slate-400">{row.tooltipText}</p>
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
  const [hoveredRow, setHoveredRow] = useState(null);
  const [newClassName, setNewClassName] = useState('');

  const total = allocation.total;

  // ------- Compute fixed total and available for % -------
  const fixedTotal = useMemo(() =>
    targets.filter(t => t.targetType === 'value').reduce((s, t) => s + t.target, 0),
    [targets]
  );
  const availableForPct = Math.max(0, total - fixedTotal);

  // ------- Derived table rows -------
  const rows = useMemo(() => targets.map((t) => {
    const match = allocation.classes.find((c) => c.class === t.assetClass) || {
      value: 0,
      pct: 0,
    };

    let targetPct, targetValue, tooltipText;
    if (t.targetType === 'value') {
      targetValue = t.target;
      targetPct = total > 0 ? (t.target / total) * 100 : 0;
      tooltipText = `Meta fixa ${formatBRL(t.target)} (equiv. ${targetPct.toFixed(1).replace('.', ',')}% do total ${formatBRL(total)})`;
    } else {
      targetPct = t.target;
      targetValue = (t.target / 100) * availableForPct;
      tooltipText = `${t.target.toFixed(0)}% x ${formatBRL(availableForPct)} (total - fixos) = ${formatBRL(targetValue)}`;
    }

    const diff = match.pct - targetPct;
    return {
      className: t.assetClass,
      icon: t.icon,
      targetType: t.targetType || 'percentage',
      currentPct: match.pct,
      targetPct,
      targetValue,
      targetRaw: t.target,
      diff,
      value: match.value,
      tooltipText,
    };
  }), [targets, allocation, total, availableForPct]);

  // ------- Chart data -------
  const chartData = rows.map((r) => ({
    name: r.className,
    Atual: parseFloat(r.currentPct.toFixed(2)),
    Meta: parseFloat(r.targetPct.toFixed(2)),
  }));

  // ------- Modal helpers -------
  function openModal() {
    setDraft(targets.map((t) => ({ ...t })));
    setNewClassName('');
    setValidationError('');
    setIsOpen(true);
  }

  function addDraftRow() {
    const name = newClassName.trim();
    if (!name) return;
    if (draft.some(d => d.assetClass.toLowerCase() === name.toLowerCase())) {
      setValidationError('Essa classe ja existe.');
      return;
    }
    setDraft([...draft, { assetClass: name, target: 0, targetType: 'percentage', icon: '' }]);
    setNewClassName('');
    setValidationError('');
  }

  function removeDraftRow(index) {
    setDraft(draft.filter((_, i) => i !== index));
  }

  function handleDraftChange(index, field, value) {
    const next = [...draft];
    next[index] = { ...next[index], [field]: value };
    setDraft(next);
    setValidationError('');
  }

  function saveTargets() {
    const pctTargets = draft.filter(d => (d.targetType || 'percentage') === 'percentage');
    const pctTotal = pctTargets.reduce((sum, d) => sum + Number(d.target), 0);
    if (pctTargets.length > 0 && Math.abs(pctTotal - 100) > 0.01) {
      setValidationError(
        `A soma das metas em % deve ser 100%. Atualmente: ${pctTotal.toFixed(1)}%`,
      );
      return;
    }
    setTargets(draft.map((d) => ({
      ...d,
      target: Number(d.target),
      targetType: d.targetType || 'percentage',
    })));
    setIsOpen(false);
  }

  // Draft totals
  const draftPctTargets = draft.filter(d => (d.targetType || 'percentage') === 'percentage');
  const draftPctTotal = draftPctTargets.reduce((sum, d) => sum + Number(d.target || 0), 0);
  const draftFixedTotal = draft
    .filter(d => d.targetType === 'value')
    .reduce((sum, d) => sum + Number(d.target || 0), 0);

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

      {/* ============== Summary Card ============== */}
      {fixedTotal > 0 && (
        <div className="glass-card p-4 flex items-center gap-4 text-sm">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-300">
            <span>Total: <strong className="text-slate-100">{formatCurrency(total, currency, exchangeRate)}</strong></span>
            <span>Fixo (R$): <strong className="text-amber-400">{formatBRL(fixedTotal)}</strong></span>
            <span>Disponivel p/ %: <strong className="text-indigo-400">{formatBRL(availableForPct)}</strong></span>
          </div>
        </div>
      )}

      {/* ============== Table ============== */}
      <div className="glass-card overflow-visible">
        <div>
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
                  Meta
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
                    onMouseEnter={() => setHoveredRow(row.className)}
                    onMouseLeave={() => setHoveredRow(null)}
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
                    <td className="text-right px-5 py-3.5 relative">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-slate-300">
                          {row.targetType === 'value'
                            ? formatBRL(row.targetRaw)
                            : formatPctUnsigned(row.targetPct)}
                        </span>
                        <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                          row.targetType === 'value'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-indigo-500/15 text-indigo-400'
                        }`}>
                          {row.targetType === 'value' ? 'R$' : '%'}
                        </span>
                      </div>
                      {hoveredRow === row.className && (
                        <RowTooltip row={row} total={total} />
                      )}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className="glass-card relative z-10 w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
              {draft.map((item, idx) => {
                const isValue = item.targetType === 'value';
                return (
                  <div
                    key={item.assetClass}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
                  >
                    <span className="text-indigo-400">
                      <ClassIcon name={item.icon} className="w-5 h-5" />
                    </span>
                    <span className="flex-1 text-sm text-slate-200 font-medium min-w-0 truncate">
                      {item.assetClass}
                    </span>

                    {/* Type toggle */}
                    <button
                      onClick={() => handleDraftChange(idx, 'targetType', isValue ? 'percentage' : 'value')}
                      className={`text-[10px] font-semibold rounded-full px-2 py-1 transition-colors ${
                        isValue
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                      }`}
                      title={isValue ? 'Clique para mudar para %' : 'Clique para mudar para R$'}
                    >
                      {isValue ? 'R$' : '%'}
                    </button>

                    <div className="flex items-center gap-1">
                      {isValue && (
                        <span className="text-sm text-slate-400">R$</span>
                      )}
                      <input
                        type="number"
                        min="0"
                        max={isValue ? undefined : 100}
                        step={isValue ? 100 : 1}
                        value={item.target}
                        onChange={(e) => handleDraftChange(idx, 'target', e.target.value)}
                        className="w-24 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-100 text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                      />
                      {!isValue && (
                        <span className="text-sm text-slate-400">%</span>
                      )}
                    </div>

                    <button
                      onClick={() => removeDraftRow(idx)}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remover classe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {/* Add new class */}
              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-white/10">
                <input
                  type="text"
                  placeholder="Nome da classe (ex: RV Brasil)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDraftRow()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                />
                <button
                  onClick={addDraftRow}
                  disabled={!newClassName.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>

            {/* Summary footer */}
            <div className="space-y-2 mb-4">
              {draftPctTargets.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-sm text-slate-400 font-medium">Total %</span>
                  <span
                    className={`text-sm font-semibold ${
                      Math.abs(draftPctTotal - 100) <= 0.01
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {draftPctTotal.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
              )}
              {draftFixedTotal > 0 && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-sm text-slate-400 font-medium">Total fixo R$</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {formatBRL(draftFixedTotal)}
                  </span>
                </div>
              )}
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
                disabled={draftPctTargets.length > 0 && Math.abs(draftPctTotal - 100) > 0.01}
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
