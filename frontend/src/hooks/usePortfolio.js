// ========================================================
// TanStack Query hooks for portfolio CRUD
// ========================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  brStocksApi,
  fiisApi,
  intlStocksApi,
  fixedIncomeApi,
  realAssetsApi,
  dividendsApi,
  watchlistApi,
  allocationTargetsApi,
  accumulationGoalsApi,
  patrimonialHistoryApi,
  fetchStaticData,
  resetSeed,
} from '../services/api';

// ---------------------------------------------------------------------------
// Generic hook factory
// ---------------------------------------------------------------------------

function useCrud(key, api) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [key],
    queryFn: api.list,
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => api.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });

  const remove = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });

  return { query, create, update, remove };
}

// ---------------------------------------------------------------------------
// Entity hooks
// ---------------------------------------------------------------------------

export function useBrStocks() {
  return useCrud('br-stocks', brStocksApi);
}

export function useFiis() {
  return useCrud('fiis', fiisApi);
}

export function useIntlStocks() {
  return useCrud('intl-stocks', intlStocksApi);
}

export function useFixedIncome() {
  return useCrud('fixed-income', fixedIncomeApi);
}

export function useRealAssets() {
  return useCrud('real-assets', realAssetsApi);
}

export function useDividends() {
  return useCrud('dividends', dividendsApi);
}

export function useWatchlist() {
  return useCrud('watchlist', watchlistApi);
}

export function useAllocationTargets() {
  return useCrud('allocation-targets', allocationTargetsApi);
}

export function useAccumulationGoals() {
  return useCrud('accumulation-goals', accumulationGoalsApi);
}

// ---------------------------------------------------------------------------
// Read-only hooks
// ---------------------------------------------------------------------------

export function usePatrimonialHistory() {
  return useQuery({
    queryKey: ['patrimonial-history'],
    queryFn: patrimonialHistoryApi.list,
    staleTime: 5 * 60_000,
  });
}

export function useStaticData() {
  return useQuery({
    queryKey: ['static-data'],
    queryFn: fetchStaticData,
    staleTime: 30 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Reset (seed)
// ---------------------------------------------------------------------------

export function useResetData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetSeed,
    onSuccess: () => qc.invalidateQueries(),
  });
}
