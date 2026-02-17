import { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Check,
  Copy,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

const GLASS = 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

const CLASS_LABEL = {
  br_stock: 'Acao BR',
  fii: 'FII',
  fi_etf: 'ETF RF',
};

const OP_BADGE = {
  compra: 'bg-emerald-500/15 text-emerald-400',
  venda: 'bg-red-500/15 text-red-400',
};

export default function ImportPreviewModal({ data, onConfirm, onClose, isConfirming }) {
  const { rows, summary } = data;

  // Separate active vs skipped rows
  const activeRows = useMemo(() => rows.filter(r => !r.isSkipped), [rows]);
  const skippedRows = useMemo(() => rows.filter(r => r.isSkipped), [rows]);

  // Selection state: default = all new (non-duplicate) selected
  const [selected, setSelected] = useState(() => {
    const set = new Set();
    activeRows.forEach((r, i) => {
      if (!r.isDuplicate) set.add(i);
    });
    return set;
  });

  const [showSkipped, setShowSkipped] = useState(false);

  const toggleRow = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    const set = new Set();
    activeRows.forEach((_, i) => set.add(i));
    setSelected(set);
  };

  const deselectAll = () => setSelected(new Set());

  const selectedRows = useMemo(
    () => activeRows.filter((_, i) => selected.has(i)),
    [activeRows, selected]
  );

  const handleConfirm = () => {
    onConfirm(selectedRows);
  };

  // New assets warning
  const newAssets = summary.newAssets || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-[#0f1424] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <FileSpreadsheet size={22} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Importar Extrato B3</h2>
              <p className="text-xs text-slate-500">Revise os lancamentos antes de importar</p>
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
        <div className="grid grid-cols-4 gap-3 px-6 py-4">
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-xl font-bold text-slate-100">{summary.total}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-slate-400">Novos</p>
            <p className="text-xl font-bold text-emerald-400">{summary.new}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-slate-400">Duplicados</p>
            <p className="text-xl font-bold text-amber-400">{summary.duplicates}</p>
          </div>
          <div className={`${GLASS} p-3 text-center`}>
            <p className="text-xs text-slate-400">Ignorados</p>
            <p className="text-xl font-bold text-slate-500">{summary.skipped}</p>
          </div>
        </div>

        {/* New assets warning */}
        {newAssets.length > 0 && (
          <div className="mx-6 mb-3 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="text-sm text-amber-200">
              <span className="font-medium">{newAssets.length} ativo(s)</span> serao criados automaticamente:{' '}
              <span className="font-mono text-amber-300">{newAssets.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-2">
          <button
            onClick={selectAll}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            Selecionar Todos
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={deselectAll}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            Desmarcar Todos
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {selected.size} de {activeRows.length} selecionados
          </span>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto px-6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f1424] z-10">
              <tr className="border-b border-white/10">
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Data</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Op</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Classe</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Ticker</th>
                <th className="text-right text-slate-400 font-medium px-2 py-2">Qtd</th>
                <th className="text-right text-slate-400 font-medium px-2 py-2">Preco</th>
                <th className="text-right text-slate-400 font-medium px-2 py-2">Total</th>
                <th className="text-left text-slate-400 font-medium px-2 py-2">Corretora</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, idx) => {
                const isSelected = selected.has(idx);
                const isDup = row.isDuplicate;
                const OpIcon = row.operationType === 'compra' ? ShoppingCart : TrendingDown;
                return (
                  <tr
                    key={idx}
                    className={`border-b border-white/5 transition-colors ${
                      isDup ? 'opacity-50' : ''
                    } ${isSelected ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(idx)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/40"
                      />
                    </td>
                    <td className="px-2 py-2 text-slate-300 whitespace-nowrap">
                      {new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${OP_BADGE[row.operationType]}`}>
                        <OpIcon size={11} />
                        {row.operationType === 'compra' ? 'Compra' : 'Venda'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-400 text-xs">
                      {CLASS_LABEL[row.assetClass] || row.assetClass}
                    </td>
                    <td className="px-2 py-2">
                      <span className="font-medium text-slate-200">{row.ticker}</span>
                      {!row.assetExists && (
                        <span className="ml-1.5 inline-flex items-center rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
                          novo
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-300">{row.qty}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{formatBRL(row.unitPrice)}</td>
                    <td className="px-2 py-2 text-right font-medium text-slate-200">{formatBRL(row.totalValue)}</td>
                    <td className="px-2 py-2 text-slate-400 text-xs">{row.broker}</td>
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
            </tbody>
          </table>

          {/* Skipped rows collapsed section */}
          {skippedRows.length > 0 && (
            <div className="mt-4 mb-2">
              <button
                onClick={() => setShowSkipped(!showSkipped)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition"
              >
                {showSkipped ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Ban size={12} />
                {skippedRows.length} lancamento(s) ignorado(s) (opcoes)
              </button>
              {showSkipped && (
                <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <table className="w-full text-xs">
                    <tbody>
                      {skippedRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-white/5 opacity-50">
                          <td className="py-1.5 text-slate-400">
                            {new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-1.5 text-slate-400">{row.ticker}</td>
                          <td className="py-1.5 text-slate-500">{row.skipReason}</td>
                          <td className="py-1.5 text-right text-slate-400">{formatBRL(row.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} />
                Importar {selected.size} lancamento{selected.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
