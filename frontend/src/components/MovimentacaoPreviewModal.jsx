import { useState, useMemo } from 'react';
import {
  X,
  Upload,
  Check,
  Copy,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Banknote,
  TrendingUp,
  Landmark,
  Ban,
} from 'lucide-react';
import { formatBRL, formatDate } from '../utils/formatters';

const GLASS = 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

const CATEGORY_CONFIG = {
  provento: { label: 'Proventos', color: 'emerald', icon: Banknote },
  renda_fixa: { label: 'Renda Fixa', color: 'indigo', icon: Landmark },
  evento: { label: 'Eventos', color: 'purple', icon: TrendingUp },
  ignorado: { label: 'Ignorados', color: 'slate', icon: Ban },
};

const IMPORT_AS_LABEL = {
  dividendo: 'Dividendo',
  jcp: 'JCP',
  rendimento: 'Rendimento',
  compra_rf: 'Compra RF',
  vencimento_rf: 'Vencimento',
  resgate_rf: 'Resgate',
  juros_rf: 'Juros',
  amortizacao_rf: 'Amortizacao',
  bonificacao: 'Bonificacao',
  desdobramento: 'Desdobro',
  venda: 'Venda',
  ignorado: 'Ignorado',
};

const IMPORT_AS_BADGE = {
  dividendo: 'bg-emerald-500/15 text-emerald-400',
  jcp: 'bg-emerald-500/15 text-emerald-400',
  rendimento: 'bg-emerald-500/15 text-emerald-400',
  compra_rf: 'bg-indigo-500/15 text-indigo-400',
  vencimento_rf: 'bg-amber-500/15 text-amber-400',
  resgate_rf: 'bg-amber-500/15 text-amber-400',
  juros_rf: 'bg-cyan-500/15 text-cyan-400',
  amortizacao_rf: 'bg-cyan-500/15 text-cyan-400',
  bonificacao: 'bg-purple-500/15 text-purple-400',
  desdobramento: 'bg-purple-500/15 text-purple-400',
  venda: 'bg-red-500/15 text-red-400',
  ignorado: 'bg-slate-500/15 text-slate-400',
};

const FILTER_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'provento', label: 'Proventos' },
  { key: 'renda_fixa', label: 'Renda Fixa' },
  { key: 'evento', label: 'Eventos' },
];

export default function MovimentacaoPreviewModal({ data, onConfirm, onClose, isConfirming }) {
  const { rows, summary } = data;

  const [selected, setSelected] = useState(() => {
    const set = new Set();
    rows.forEach((r, i) => {
      if (!r.isDuplicate && !r.isSkipped) set.add(i);
    });
    return set;
  });

  const [activeFilter, setActiveFilter] = useState('all');
  const [showIgnored, setShowIgnored] = useState(false);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'all') return rows.filter(r => !r.isSkipped);
    return rows.filter(r => r.category === activeFilter && !r.isSkipped);
  }, [rows, activeFilter]);

  const ignoredRows = useMemo(() => rows.filter(r => r.isSkipped), [rows]);

  const toggleRow = (globalIdx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      return next;
    });
  };

  const selectAllVisible = () => {
    const next = new Set(selected);
    filteredRows.forEach(r => {
      const idx = rows.indexOf(r);
      next.add(idx);
    });
    setSelected(next);
  };

  const deselectAllVisible = () => {
    const next = new Set(selected);
    filteredRows.forEach(r => {
      const idx = rows.indexOf(r);
      next.delete(idx);
    });
    setSelected(next);
  };

  const selectedRows = useMemo(
    () => rows.filter((_, i) => selected.has(i)),
    [rows, selected]
  );

  const handleConfirm = () => {
    onConfirm(selectedRows);
  };

  // Count selected per category
  const selectedCounts = useMemo(() => {
    const counts = { provento: 0, renda_fixa: 0, evento: 0 };
    for (const idx of selected) {
      const row = rows[idx];
      if (row && counts[row.category] !== undefined) {
        counts[row.category]++;
      }
    }
    return counts;
  }, [selected, rows]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-[#0f1424] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <Upload size={22} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Importar Movimentacoes B3</h2>
              <p className="text-xs text-slate-500">Proventos, renda fixa e eventos corporativos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-3 px-6 py-4">
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-emerald-400">Proventos</p>
            <p className="text-xl font-bold text-slate-100">{summary.proventos}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-indigo-400">Renda Fixa</p>
            <p className="text-xl font-bold text-slate-100">{summary.rendaFixa}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-purple-400">Eventos</p>
            <p className="text-xl font-bold text-slate-100">{summary.eventos}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-slate-400">Ignorados</p>
            <p className="text-xl font-bold text-slate-100">{summary.ignorados}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-amber-400">Duplicados</p>
            <p className="text-xl font-bold text-slate-100">{summary.duplicates}</p>
          </div>
        </div>

        {/* New assets warning */}
        {summary.newAssets && summary.newAssets.length > 0 && (
          <div className="mx-6 mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-amber-400" />
              <p className="text-xs font-medium text-amber-300">
                {summary.newAssets.length} novo(s) ativo(s) serao criados:
              </p>
            </div>
            <p className="text-xs text-amber-300/70 ml-5">
              {summary.newAssets.join(', ')}
            </p>
          </div>
        )}

        {/* Category filter tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 px-6">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 text-xs font-medium transition border-b-2 ${
                activeFilter === tab.key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-2">
          <button onClick={selectAllVisible} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
            Selecionar Todos
          </button>
          <span className="text-slate-600">|</span>
          <button onClick={deselectAllVisible} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
            Desmarcar Todos
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {selected.size} de {rows.filter(r => !r.isSkipped).length} selecionados
            {' '}(
            <span className="text-emerald-400">{selectedCounts.provento} prov</span>
            {' / '}
            <span className="text-indigo-400">{selectedCounts.renda_fixa} RF</span>
            {' / '}
            <span className="text-purple-400">{selectedCounts.evento} evt</span>
            )
          </span>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto px-6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f1424] z-10">
              <tr className="border-b border-white/10">
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Data</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Tipo</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Categoria</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Produto / Ticker</th>
                <th className="text-right text-slate-400 font-medium px-2 py-2">Qtd</th>
                <th className="text-right text-slate-400 font-medium px-2 py-2">Valor</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Corretora</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const globalIdx = rows.indexOf(row);
                const isSelected = selected.has(globalIdx);
                const isDup = row.isDuplicate;
                return (
                  <tr
                    key={globalIdx}
                    className={`border-b border-white/5 transition-colors ${
                      isDup ? 'opacity-50' : ''
                    } ${isSelected ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(globalIdx)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/40"
                      />
                    </td>
                    <td className="px-2 py-2 text-slate-300 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${IMPORT_AS_BADGE[row.importAs] || 'bg-slate-500/15 text-slate-400'}`}>
                        {IMPORT_AS_LABEL[row.importAs] || row.importAs}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-400">
                      {CATEGORY_CONFIG[row.category]?.label || row.category}
                    </td>
                    <td className="px-2 py-2">
                      {row.ticker ? (
                        <>
                          <span className="font-medium text-slate-200">{row.ticker}</span>
                          <span className="ml-1 text-xs text-slate-500">{row.assetName}</span>
                        </>
                      ) : row.rfCode ? (
                        <>
                          <span className="font-medium text-slate-200">{row.rfType}: {row.rfCode}</span>
                          {row.assetName !== row.rfCode && (
                            <span className="ml-1 text-xs text-slate-500">{row.assetName}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300 text-xs">{row.product}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-300">
                      {row.qty != null ? row.qty : '-'}
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-slate-200">
                      {row.totalValue ? formatBRL(row.totalValue) : '-'}
                    </td>
                    <td className="px-2 py-2 text-slate-400 text-xs">{row.institution || '-'}</td>
                    <td className="px-2 py-2 text-center">
                      {isDup ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          <Copy size={10} />
                          Duplicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <Check size={10} />
                          Novo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-slate-500">
                    Nenhuma movimentacao nesta categoria
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Ignored section (collapsible) */}
          {ignoredRows.length > 0 && activeFilter === 'all' && (
            <div className="mt-4 mb-2">
              <button
                onClick={() => setShowIgnored(!showIgnored)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition"
              >
                {showIgnored ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {ignoredRows.length} movimentacoes ignoradas (transferencias, opcoes, etc.)
              </button>
              {showIgnored && (
                <table className="w-full text-sm mt-2">
                  <tbody>
                    {ignoredRows.map((row, i) => (
                      <tr key={`ign-${i}`} className="border-b border-white/5 opacity-40">
                        <td className="w-10 px-2 py-1"></td>
                        <td className="px-2 py-1 text-slate-400 whitespace-nowrap text-xs">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-2 py-1 text-slate-500 text-xs">{row.movementType}</td>
                        <td className="px-2 py-1 text-slate-500 text-xs" colSpan={3}>{row.product}</td>
                        <td className="px-2 py-1 text-slate-600 text-xs">{row.skipReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0 || isConfirming}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload size={16} />
                Importar {selected.size} movimentacao{selected.size !== 1 ? 'es' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
