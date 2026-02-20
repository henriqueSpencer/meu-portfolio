import { useState } from 'react';
import { useUsers, usePendingUsers, useApproveUser, useUpdateUser, useDeleteUser } from '../../hooks/useAdmin';
import { UserCheck, UserX, Trash2, Loader2, Shield, User } from 'lucide-react';

export default function AdminUsersTab({ pendingOnly = false }) {
  const { data: allUsers, isLoading: loadingAll } = useUsers();
  const { data: pendingUsers, isLoading: loadingPending } = usePendingUsers();
  const approveMutation = useApproveUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const [editingId, setEditingId] = useState(null);

  const users = pendingOnly ? pendingUsers : allUsers;
  const loading = pendingOnly ? loadingPending : loadingAll;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const title = pendingOnly ? 'Aprovacoes Pendentes' : 'Usuarios';

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-slate-200">{title}</h2>

      {!users?.length ? (
        <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center text-slate-500">
          {pendingOnly ? 'Nenhuma aprovacao pendente' : 'Nenhum usuario encontrado'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Role</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Data</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-3 text-slate-200">
                    <div className="flex items-center gap-2">
                      {u.role === 'admin' ? (
                        <Shield className="h-4 w-4 text-purple-400" />
                      ) : (
                        <User className="h-4 w-4 text-slate-500" />
                      )}
                      {u.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!u.emailVerified ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Email pendente</span>
                    ) : !u.isApproved ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Aguardando aprovacao</span>
                    ) : !u.isActive ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Inativo</span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">Ativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!u.isApproved && u.emailVerified && u.role !== 'admin' && (
                        <button
                          onClick={() => approveMutation.mutate(u.id)}
                          disabled={approveMutation.isPending}
                          className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/20"
                          title="Aprovar"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      {u.isActive && u.role !== 'admin' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: false } })}
                          disabled={updateMutation.isPending}
                          className="rounded-lg p-1.5 text-amber-400 transition hover:bg-amber-500/20"
                          title="Desativar"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      {!u.isActive && u.role !== 'admin' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: true } })}
                          disabled={updateMutation.isPending}
                          className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/20"
                          title="Ativar"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Deletar usuario ${u.email}?`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/20"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
