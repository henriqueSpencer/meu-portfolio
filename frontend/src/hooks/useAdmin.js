import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, adminApi } from '../services/api';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: usersApi.list });
}

export function usePendingUsers() {
  return useQuery({ queryKey: ['users', 'pending'], queryFn: usersApi.listPending });
}

export function useAdminMetrics() {
  return useQuery({ queryKey: ['admin', 'metrics'], queryFn: adminApi.metrics });
}

export function useAdminLogs(params = {}) {
  return useQuery({
    queryKey: ['admin', 'logs', params],
    queryFn: () => adminApi.logs(params),
  });
}

export function useApproveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => usersApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}
