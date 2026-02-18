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
  fiEtfsApi,
  cashAccountsApi,
  transactionsApi,
  patrimonialHistoryApi,
  fetchStaticData,
  resetSeed,
  uploadB3Preview,
  confirmB3Import,
  uploadB3MovPreview,
  confirmB3MovImport,
  exportPortfolio,
  resetPortfolio,
  uploadBackupPreview,
  confirmBackupImport,
  updateSectors,
  fetchClosedPositionMetrics,
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

export function useFiEtfs() {
  return useCrud('fi-etfs', fiEtfsApi);
}

export function useCashAccounts() {
  return useCrud('cash-accounts', cashAccountsApi);
}

// ---------------------------------------------------------------------------
// Transactions hook (custom — invalidates all asset queries on mutate)
// ---------------------------------------------------------------------------

const ASSET_KEYS = ['br-stocks', 'fiis', 'intl-stocks', 'fixed-income', 'real-assets', 'fi-etfs', 'cash-accounts'];

export function useTransactions() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.list,
    staleTime: 60_000,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] });
    for (const key of ASSET_KEYS) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };

  const create = useMutation({
    mutationFn: (data) => transactionsApi.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => transactionsApi.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id) => transactionsApi.remove(id),
    onSuccess: invalidateAll,
  });

  return { query, create, update, remove };
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

// ---------------------------------------------------------------------------
// B3 Import
// ---------------------------------------------------------------------------

export function useB3Import() {
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (file) => uploadB3Preview(file),
  });

  const confirm = useMutation({
    mutationFn: (rows) => confirmB3Import(rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      for (const key of ASSET_KEYS) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  return { preview, confirm };
}

// ---------------------------------------------------------------------------
// B3 Movimentacao Import
// ---------------------------------------------------------------------------

export function useB3MovImport() {
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (file) => uploadB3MovPreview(file),
  });

  const confirm = useMutation({
    mutationFn: (rows) => confirmB3MovImport(rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dividends'] });
      for (const key of ASSET_KEYS) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  return { preview, confirm };
}

// ---------------------------------------------------------------------------
// Portfolio Reset
// ---------------------------------------------------------------------------

export function usePortfolioReset() {
  const qc = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: () => exportPortfolio(),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPortfolio(),
    onSuccess: () => qc.invalidateQueries(),
  });

  return { export: exportMutation, reset: resetMutation };
}

// ---------------------------------------------------------------------------
// Backup Import
// ---------------------------------------------------------------------------

export function useBackupImport() {
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (file) => uploadBackupPreview(file),
  });

  const confirm = useMutation({
    mutationFn: (rows) => confirmBackupImport(rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      for (const key of ASSET_KEYS) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  return { preview, confirm };
}

// ---------------------------------------------------------------------------
// Closed Position Metrics (lazy-loaded)
// ---------------------------------------------------------------------------

export function useClosedPositionMetrics(assetClass, enabled = false) {
  return useQuery({
    queryKey: ['closed-position-metrics', assetClass],
    queryFn: () => fetchClosedPositionMetrics(assetClass),
    enabled,
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Sector Update
// ---------------------------------------------------------------------------

export function useSectorUpdate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => updateSectors(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['br-stocks'] });
      qc.invalidateQueries({ queryKey: ['fiis'] });
      qc.invalidateQueries({ queryKey: ['intl-stocks'] });
    },
  });
}
