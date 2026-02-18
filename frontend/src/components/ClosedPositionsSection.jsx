import { useState } from 'react';
import { Archive, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';

export default function ClosedPositionsSection({
  items,
  title = 'Posicoes Encerradas',
  columns,
  renderRow,
  metrics,
  metricsLoading,
  onExpand,
  onPermanentDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !hasExpanded) {
      setHasExpanded(true);
      onExpand?.();
    }
  }

  return (
    <section className="rounded-xl border border-amber-500/20 bg-white/[0.02] backdrop-blur-md">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer bg-transparent border-none outline-none"
      >
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">
            {title}
          </span>
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
            {items.length}
          </span>
        </div>
        <span className="text-slate-400 transition-transform duration-200">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5">
          {metricsLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando metricas...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {columns.map((col, i) => (
                      <th
                        key={i}
                        className={`text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium ${
                          col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                    {onPermanentDelete && (
                      <th className="text-center text-slate-400 text-xs uppercase tracking-wider py-3 px-2 font-medium w-10" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.ticker || item.id || idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      {renderRow(item, metrics?.[item.ticker || item.id])}
                      {onPermanentDelete && (
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => onPermanentDelete(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
