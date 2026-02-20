import { useState } from 'react';
import { useAdminLogs } from '../../hooks/useAdmin';
import { Loader2, ChevronDown } from 'lucide-react';

export default function AdminLogsTab() {
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const { data: logs, isLoading } = useAdminLogs({ limit, offset });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-slate-200">Logs de Atividade</h2>

      {!logs?.length ? (
        <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center text-slate-500">
          Nenhum log encontrado
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Acao</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Recurso</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.userId?.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.resource}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length >= limit && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setOffset(prev => prev + limit)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/10"
              >
                <ChevronDown className="h-4 w-4" />
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
