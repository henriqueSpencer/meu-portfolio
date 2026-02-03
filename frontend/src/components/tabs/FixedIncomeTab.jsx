import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatCurrency,
  formatPct,
  formatDate,
  colorClass,
} from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Shield, Calendar, TrendingUp, Plus } from 'lucide-react';
import { CHART_COLORS } from '../../data/mockData';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

// -------------------------------------------------------
// Color mapping for bond types
// -------------------------------------------------------
const TYPE_COLORS = {
  'Tesouro Direto': CHART_COLORS[0], // indigo
  CDB: CHART_COLORS[1],              // purple
  LCI: CHART_COLORS[3],              // emerald
  LCA: CHART_COLORS[2],              // cyan
  Debenture: CHART_COLORS[4],        // amber
  CRI: CHART_COLORS[7],              // teal
  CRA: CHART_COLORS[5],              // red
};

function getTypeColor(type) {
  return TYPE_COLORS[type] || CHART_COLORS[8];
}

// -------------------------------------------------------
// Custom tooltip for the maturity timeline chart
// -------------------------------------------------------
function MaturityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-slate-200 font-medium mb-1">{d.title}</p>
      <p className="text-slate-400">
        Tipo: <span className="text-slate-300">{d.type}</span>
      </p>
      <p className="text-slate-400">
        Vencimento: <span className="text-slate-300">{formatDate(d.maturityDate)}</span>
      </p>
      <p className="text-slate-400">
        Prazo restante:{' '}
        <span className="text-slate-300">
          {d.months < 12
            ? `${d.months} ${d.months === 1 ? 'mes' : 'meses'}`
            : `${(d.months / 12).toFixed(1)} anos`}
        </span>
      </p>
    </div>
  );
}

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
const EMPTY_BOND = {
  title: '', type: 'Tesouro Direto', rate: '', appliedValue: '', currentValue: '',
  applicationDate: '', maturityDate: '', broker: '',
};

export default function FixedIncomeTab() {
  const { fixedIncome, setFixedIncome, currency, exchangeRate } = useApp();
  const [sortField, setSortField] = useState('maturityDate');
  const [sortAsc, setSortAsc] = useState(true);

  // ---- CRUD state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_BOND);

  function handleAdd() {
    setEditing(null);
    setForm(EMPTY_BOND);
    setModalOpen(true);
  }

  function handleEdit(bond) {
    setEditing(bond);
    setForm({
      title: bond.title,
      type: bond.type,
      rate: bond.rate,
      appliedValue: String(bond.appliedValue),
      currentValue: String(bond.currentValue),
      applicationDate: bond.applicationDate || '',
      maturityDate: bond.maturityDate || '',
      broker: bond.broker || '',
    });
    setModalOpen(true);
  }

  function handleSave() {
    const parsed = {
      id: editing ? editing.id : String(Date.now()),
      title: form.title.trim(),
      type: form.type,
      rate: form.rate.trim(),
      appliedValue: Number(form.appliedValue) || 0,
      currentValue: Number(form.currentValue) || 0,
      applicationDate: form.applicationDate,
      maturityDate: form.maturityDate,
      broker: form.broker.trim(),
    };
    if (!parsed.title) return;
    if (editing) {
      setFixedIncome((prev) => prev.map((b) => (b.id === editing.id ? parsed : b)));
    } else {
      setFixedIncome((prev) => [...prev, parsed]);
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (!editing) return;
    setFixedIncome((prev) => prev.filter((b) => b.id !== editing.id));
    setModalOpen(false);
  }

  // ---- derived calculations ----
  const summary = useMemo(() => {
    const totalApplied = fixedIncome.reduce((s, b) => s + b.appliedValue, 0);
    const totalCurrent = fixedIncome.reduce((s, b) => s + b.currentValue, 0);
    const totalReturn = totalCurrent - totalApplied;
    const overallReturnPct =
      totalApplied > 0 ? (totalReturn / totalApplied) * 100 : 0;

    // weighted average return: sum(returnPct_i * appliedValue_i) / sum(appliedValue_i)
    const weightedReturn =
      totalApplied > 0
        ? fixedIncome.reduce((s, b) => {
            const retPct =
              b.appliedValue > 0
                ? ((b.currentValue - b.appliedValue) / b.appliedValue) * 100
                : 0;
            return s + retPct * b.appliedValue;
          }, 0) / totalApplied
        : 0;

    return { totalApplied, totalCurrent, totalReturn, overallReturnPct, weightedReturn };
  }, [fixedIncome]);

  // ---- sorted table data ----
  const sortedBonds = useMemo(() => {
    const copy = [...fixedIncome];
    copy.sort((a, b) => {
      let va, vb;
      if (sortField === 'returnPct') {
        va = a.appliedValue > 0 ? (a.currentValue - a.appliedValue) / a.appliedValue : 0;
        vb = b.appliedValue > 0 ? (b.currentValue - b.appliedValue) / b.appliedValue : 0;
      } else if (
        sortField === 'appliedValue' ||
        sortField === 'currentValue'
      ) {
        va = a[sortField];
        vb = b[sortField];
      } else if (
        sortField === 'applicationDate' ||
        sortField === 'maturityDate'
      ) {
        va = new Date(a[sortField] + 'T00:00:00').getTime();
        vb = new Date(b[sortField] + 'T00:00:00').getTime();
      } else {
        va = (a[sortField] || '').toString().toLowerCase();
        vb = (b[sortField] || '').toString().toLowerCase();
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [fixedIncome, sortField, sortAsc]);

  // ---- maturity timeline chart data ----
  const maturityData = useMemo(() => {
    const now = new Date();
    return fixedIncome
      .map((b) => {
        const maturity = new Date(b.maturityDate + 'T00:00:00');
        const diffMs = maturity.getTime() - now.getTime();
        const months = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44)), 0);
        return {
          title: b.title,
          type: b.type,
          months,
          maturityDate: b.maturityDate,
          appliedValue: b.appliedValue,
        };
      })
      .sort((a, b) => a.months - b.months);
  }, [fixedIncome]);

  // ---- sort handler ----
  function handleSort(field) {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function sortIndicator(field) {
    if (sortField !== field) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  }

  // ---- render ----
  return (
    <div className="space-y-6">
      {/* ===================== SUMMARY CARD ===================== */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Resumo - Renda Fixa
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total invested */}
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Total Investido
            </p>
            <p className="text-xl font-bold text-slate-100">
              {formatCurrency(summary.totalApplied, currency, exchangeRate)}
            </p>
          </div>

          {/* Current value */}
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Valor Atual
            </p>
            <p className="text-xl font-bold text-slate-100">
              {formatCurrency(summary.totalCurrent, currency, exchangeRate)}
            </p>
          </div>

          {/* Weighted avg return */}
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Retorno Medio Ponderado
            </p>
            <p className={`text-xl font-bold ${colorClass(summary.weightedReturn)}`}>
              {formatPct(summary.weightedReturn)}
            </p>
          </div>

          {/* Overall return */}
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Lucro Total
            </p>
            <p className={`text-xl font-bold ${colorClass(summary.totalReturn)}`}>
              {formatCurrency(summary.totalReturn, currency, exchangeRate)}
            </p>
            <p className={`text-xs mt-0.5 ${colorClass(summary.overallReturnPct)}`}>
              {formatPct(summary.overallReturnPct)}
            </p>
          </div>
        </div>
      </div>

      {/* ===================== FIXED INCOME TABLE ===================== */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Titulos de Renda Fixa
          </h2>
          <button
            onClick={handleAdd}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Titulo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  { key: 'title', label: 'Titulo' },
                  { key: 'type', label: 'Tipo' },
                  { key: 'rate', label: 'Taxa' },
                  { key: 'applicationDate', label: 'Aplicacao' },
                  { key: 'maturityDate', label: 'Vencimento' },
                  { key: 'appliedValue', label: 'Valor Aplicado', align: 'right' },
                  { key: 'currentValue', label: 'Valor Atual', align: 'right' },
                  { key: 'returnPct', label: 'Retorno %', align: 'right' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 select-none whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                    {sortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedBonds.map((bond) => {
                const returnPct =
                  bond.appliedValue > 0
                    ? ((bond.currentValue - bond.appliedValue) / bond.appliedValue) * 100
                    : 0;

                return (
                  <tr
                    key={bond.id}
                    onClick={() => handleEdit(bond)}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 text-slate-200 font-medium whitespace-nowrap">
                      {bond.title}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${getTypeColor(bond.type)}20`,
                          color: getTypeColor(bond.type),
                        }}
                      >
                        {bond.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {bond.rate}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatDate(bond.applicationDate)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatDate(bond.maturityDate)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap">
                      {formatCurrency(bond.appliedValue, currency, exchangeRate)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200 font-medium whitespace-nowrap">
                      {formatCurrency(bond.currentValue, currency, exchangeRate)}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${colorClass(returnPct)}`}>
                      {formatPct(returnPct)}
                    </td>
                  </tr>
                );
              })}

              {/* ---------- total row ---------- */}
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td className="py-3 px-3 text-slate-200 font-bold" colSpan={5}>
                  Total
                </td>
                <td className="py-3 px-3 text-right text-slate-200 font-bold whitespace-nowrap">
                  {formatCurrency(summary.totalApplied, currency, exchangeRate)}
                </td>
                <td className="py-3 px-3 text-right text-slate-100 font-bold whitespace-nowrap">
                  {formatCurrency(summary.totalCurrent, currency, exchangeRate)}
                </td>
                <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${colorClass(summary.overallReturnPct)}`}>
                  {formatPct(summary.overallReturnPct)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================ MATURITY TIMELINE CHART ================ */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Cronograma de Vencimentos
          </h2>
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          {[...new Set(fixedIncome.map((b) => b.type))].map((type) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: getTypeColor(type) }}
              />
              {type}
            </div>
          ))}
        </div>

        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={maturityData}
              layout="vertical"
              margin={{ top: 4, right: 30, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                label={{
                  value: 'Meses ate o vencimento',
                  position: 'insideBottomRight',
                  offset: -4,
                  fill: '#64748b',
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="title"
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={180}
              />
              <Tooltip
                content={<MaturityTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar
                dataKey="months"
                radius={[0, 6, 6, 0]}
                barSize={20}
              >
                {maturityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getTypeColor(entry.type)}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* small caption */}
        <p className="text-xs text-slate-500 mt-3 text-right">
          Referencia: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* ---- CRUD Modal ---- */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${editing.title}` : 'Adicionar Titulo'}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      >
        <FormField label="Titulo">
          <FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Tesouro IPCA+ 2029" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo">
            <FormSelect value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {['Tesouro Direto', 'CDB', 'LCI', 'LCA', 'Debenture', 'CRI', 'CRA'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Corretora">
            <FormInput value={form.broker} onChange={(e) => setForm((f) => ({ ...f, broker: e.target.value }))} placeholder="BTG" />
          </FormField>
        </div>
        <FormField label="Taxa">
          <FormInput value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} placeholder="IPCA + 6.20%" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Valor Aplicado">
            <FormInput type="number" step="0.01" value={form.appliedValue} onChange={(e) => setForm((f) => ({ ...f, appliedValue: e.target.value }))} />
          </FormField>
          <FormField label="Valor Atual">
            <FormInput type="number" step="0.01" value={form.currentValue} onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data Aplicacao">
            <FormInput type="date" value={form.applicationDate} onChange={(e) => setForm((f) => ({ ...f, applicationDate: e.target.value }))} />
          </FormField>
          <FormField label="Data Vencimento">
            <FormInput type="date" value={form.maturityDate} onChange={(e) => setForm((f) => ({ ...f, maturityDate: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
