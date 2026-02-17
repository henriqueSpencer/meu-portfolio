import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { calculateAllocation } from '../utils/calculations';
import { toSnakeCase } from '../utils/apiHelpers';
import { useBrQuotes, useExchangeRate } from '../hooks/useMarketData';
import {
  useBrStocks,
  useFiis,
  useIntlStocks,
  useFixedIncome,
  useRealAssets,
  useDividends,
  useWatchlist,
  useAllocationTargets,
  useAccumulationGoals,
  useFiEtfs,
  useCashAccounts,
  useTransactions,
  usePatrimonialHistory,
  useStaticData,
  useResetData,
  useB3Import,
} from '../hooks/usePortfolio';

const FALLBACK_EXCHANGE_RATE = 6.05;
const EMPTY = [];
const EMPTY_OBJ = {};

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currency, setCurrency] = useState('BRL');
  const [brokerFilter, setBrokerFilter] = useState('Todas');

  // ---------------------------------------------------------------------------
  // Portfolio data (from backend via TanStack Query)
  // ---------------------------------------------------------------------------
  const brStocksCrud = useBrStocks();
  const fiisCrud = useFiis();
  const intlStocksCrud = useIntlStocks();
  const fixedIncomeCrud = useFixedIncome();
  const realAssetsCrud = useRealAssets();
  const dividendsCrud = useDividends();
  const watchlistCrud = useWatchlist();
  const targetsCrud = useAllocationTargets();
  const accGoalsCrud = useAccumulationGoals();
  const fiEtfsCrud = useFiEtfs();
  const cashAccountsCrud = useCashAccounts();
  const transactionsCrud = useTransactions();
  const patrimonialHistoryQuery = usePatrimonialHistory();
  const staticDataQuery = useStaticData();
  const resetMutation = useResetData();
  const b3Import = useB3Import();

  // Raw data arrays (fallback to stable empty refs while loading)
  const brStocks = brStocksCrud.query.data ?? EMPTY;
  const fiis = fiisCrud.query.data ?? EMPTY;
  const intlStocks = intlStocksCrud.query.data ?? EMPTY;
  const fixedIncome = fixedIncomeCrud.query.data ?? EMPTY;
  const realAssets = realAssetsCrud.query.data ?? EMPTY;
  const dividends = dividendsCrud.query.data ?? EMPTY;
  const watchlist = watchlistCrud.query.data ?? EMPTY;
  const targets = targetsCrud.query.data ?? EMPTY;
  const accumulationGoals = accGoalsCrud.query.data ?? EMPTY;
  const fiEtfs = fiEtfsCrud.query.data ?? EMPTY;
  const cashAccounts = cashAccountsCrud.query.data ?? EMPTY;
  const transactions = transactionsCrud.query.data ?? EMPTY;
  const patrimonialHistory = patrimonialHistoryQuery.data ?? EMPTY;
  const staticData = staticDataQuery.data ?? EMPTY_OBJ;

  const accumulationHistory = staticData.accumulationHistory ?? EMPTY;
  const benchmarks = staticData.benchmarks ?? EMPTY_OBJ;

  // ---------------------------------------------------------------------------
  // Live market data (TanStack Query hooks)
  // ---------------------------------------------------------------------------
  const brTickers = useMemo(() => [
    ...brStocks.map(s => s.ticker),
    ...fiis.map(f => f.ticker),
    ...fiEtfs.map(e => e.ticker),
  ], [brStocks, fiis, fiEtfs]);

  const quotesQuery = useBrQuotes(brTickers);
  const exchangeRateQuery = useExchangeRate();

  const exchangeRate = exchangeRateQuery.data ?? FALLBACK_EXCHANGE_RATE;

  const livePriceMap = useMemo(() => {
    const map = {};
    const results = quotesQuery.data;
    if (!results) return map;
    for (const q of results) {
      if (q.symbol && q.regularMarketPrice != null) {
        map[q.symbol] = q.regularMarketPrice;
      }
    }
    return map;
  }, [quotesQuery.data]);

  const liveBrStocks = useMemo(() => {
    if (Object.keys(livePriceMap).length === 0) return brStocks;
    return brStocks.map(s => {
      const live = livePriceMap[s.ticker];
      return live != null && live !== s.currentPrice ? { ...s, currentPrice: live } : s;
    });
  }, [brStocks, livePriceMap]);

  const liveFiis = useMemo(() => {
    if (Object.keys(livePriceMap).length === 0) return fiis;
    return fiis.map(f => {
      const live = livePriceMap[f.ticker];
      return live != null && live !== f.currentPrice ? { ...f, currentPrice: live } : f;
    });
  }, [fiis, livePriceMap]);

  const liveFiEtfs = useMemo(() => {
    if (Object.keys(livePriceMap).length === 0) return fiEtfs;
    return fiEtfs.map(e => {
      const live = livePriceMap[e.ticker];
      return live != null && live !== e.currentPrice ? { ...e, currentPrice: live } : e;
    });
  }, [fiEtfs, livePriceMap]);

  const marketDataStatus = useMemo(() => ({
    quotesUpdatedAt: quotesQuery.dataUpdatedAt || null,
    quotesIsLoading: quotesQuery.isLoading,
    quotesIsError: quotesQuery.isError,
    quotesEnabled: true,
    exchangeRateUpdatedAt: exchangeRateQuery.dataUpdatedAt || null,
    exchangeRateLive: exchangeRateQuery.data != null,
  }), [
    quotesQuery.dataUpdatedAt,
    quotesQuery.isLoading,
    quotesQuery.isError,
    exchangeRateQuery.dataUpdatedAt,
    exchangeRateQuery.data,
  ]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const allocation = useMemo(
    () => calculateAllocation(liveBrStocks, liveFiis, intlStocks, fixedIncome, exchangeRate, liveFiEtfs, cashAccounts),
    [liveBrStocks, liveFiis, intlStocks, fixedIncome, exchangeRate, liveFiEtfs, cashAccounts]
  );

  const totalPatrimony = useMemo(() => {
    const financial = allocation.total;
    const immobilized = realAssets
      .filter(a => a.includeInTotal)
      .reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
    return financial + immobilized;
  }, [allocation, realAssets]);

  const dividendsSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTotal = dividends
      .filter(d => {
        const dt = new Date(d.date + 'T00:00:00');
        return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + d.value, 0);

    const yearTotal = dividends
      .filter(d => {
        const dt = new Date(d.date + 'T00:00:00');
        return dt.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + d.value, 0);

    return { monthTotal, yearTotal };
  }, [dividends]);

  const watchlistAlerts = useMemo(
    () => watchlist.filter(w => w.currentPrice <= w.targetPrice),
    [watchlist]
  );

  // ---------------------------------------------------------------------------
  // CRUD mutation wrappers (match old setter-style API for tabs)
  // ---------------------------------------------------------------------------

  const setBrStocks = useCallback((updater) => {
    const prev = brStocks;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevTickers = new Set(prev.map(s => s.ticker));
    const nextTickers = new Set(next.map(s => s.ticker));
    for (const item of next.filter(s => !prevTickers.has(s.ticker))) {
      brStocksCrud.create.mutate(toSnakeCase(item, 'brStock'));
    }
    for (const item of prev.filter(s => !nextTickers.has(s.ticker))) {
      brStocksCrud.remove.mutate(item.ticker);
    }
    for (const item of next.filter(s => prevTickers.has(s.ticker))) {
      const old = prev.find(s => s.ticker === item.ticker);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        brStocksCrud.update.mutate({ id: item.ticker, data: toSnakeCase(item, 'brStock') });
      }
    }
  }, [brStocks, brStocksCrud]);

  const setFiis = useCallback((updater) => {
    const prev = fiis;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevTickers = new Set(prev.map(f => f.ticker));
    const nextTickers = new Set(next.map(f => f.ticker));
    for (const item of next.filter(f => !prevTickers.has(f.ticker))) {
      fiisCrud.create.mutate(toSnakeCase(item, 'fii'));
    }
    for (const item of prev.filter(f => !nextTickers.has(f.ticker))) {
      fiisCrud.remove.mutate(item.ticker);
    }
    for (const item of next.filter(f => prevTickers.has(f.ticker))) {
      const old = prev.find(f => f.ticker === item.ticker);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        fiisCrud.update.mutate({ id: item.ticker, data: toSnakeCase(item, 'fii') });
      }
    }
  }, [fiis, fiisCrud]);

  const setIntlStocks = useCallback((updater) => {
    const prev = intlStocks;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevTickers = new Set(prev.map(s => s.ticker));
    const nextTickers = new Set(next.map(s => s.ticker));
    for (const item of next.filter(s => !prevTickers.has(s.ticker))) {
      intlStocksCrud.create.mutate(toSnakeCase(item, 'intlStock'));
    }
    for (const item of prev.filter(s => !nextTickers.has(s.ticker))) {
      intlStocksCrud.remove.mutate(item.ticker);
    }
    for (const item of next.filter(s => prevTickers.has(s.ticker))) {
      const old = prev.find(s => s.ticker === item.ticker);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        intlStocksCrud.update.mutate({ id: item.ticker, data: toSnakeCase(item, 'intlStock') });
      }
    }
  }, [intlStocks, intlStocksCrud]);

  const setFixedIncome = useCallback((updater) => {
    const prev = fixedIncome;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevIds = new Set(prev.map(f => f.id));
    const nextIds = new Set(next.map(f => f.id));
    for (const item of next.filter(f => !prevIds.has(f.id))) {
      fixedIncomeCrud.create.mutate(toSnakeCase(item, 'fixedIncome'));
    }
    for (const item of prev.filter(f => !nextIds.has(f.id))) {
      fixedIncomeCrud.remove.mutate(item.id);
    }
    for (const item of next.filter(f => prevIds.has(f.id))) {
      const old = prev.find(f => f.id === item.id);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        fixedIncomeCrud.update.mutate({ id: item.id, data: toSnakeCase(item, 'fixedIncome') });
      }
    }
  }, [fixedIncome, fixedIncomeCrud]);

  const setRealAssets = useCallback((updater) => {
    const prev = realAssets;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevIds = new Set(prev.map(a => a.id));
    const nextIds = new Set(next.map(a => a.id));
    for (const item of next.filter(a => !prevIds.has(a.id))) {
      realAssetsCrud.create.mutate(toSnakeCase(item, 'realAsset'));
    }
    for (const item of prev.filter(a => !nextIds.has(a.id))) {
      realAssetsCrud.remove.mutate(item.id);
    }
    for (const item of next.filter(a => prevIds.has(a.id))) {
      const old = prev.find(a => a.id === item.id);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        realAssetsCrud.update.mutate({ id: item.id, data: toSnakeCase(item, 'realAsset') });
      }
    }
  }, [realAssets, realAssetsCrud]);

  const setDividends = useCallback((updater) => {
    const prev = dividends;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevIds = new Set(prev.map(d => d.id));
    const nextIds = new Set(next.map(d => d.id));
    for (const item of next.filter(d => !prevIds.has(d.id))) {
      dividendsCrud.create.mutate(item);
    }
    for (const item of prev.filter(d => !nextIds.has(d.id))) {
      dividendsCrud.remove.mutate(item.id);
    }
  }, [dividends, dividendsCrud]);

  const setWatchlist = useCallback((updater) => {
    const prev = watchlist;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevTickers = new Set(prev.map(w => w.ticker));
    const nextTickers = new Set(next.map(w => w.ticker));
    for (const item of next.filter(w => !prevTickers.has(w.ticker))) {
      watchlistCrud.create.mutate(toSnakeCase(item, 'watchlist'));
    }
    for (const item of prev.filter(w => !nextTickers.has(w.ticker))) {
      watchlistCrud.remove.mutate(item.ticker);
    }
    for (const item of next.filter(w => prevTickers.has(w.ticker))) {
      const old = prev.find(w => w.ticker === item.ticker);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        watchlistCrud.update.mutate({ id: item.ticker, data: toSnakeCase(item, 'watchlist') });
      }
    }
  }, [watchlist, watchlistCrud]);

  const setTargets = useCallback((updater) => {
    const prev = targets;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    for (const item of next) {
      const old = prev.find(t => t.id === item.id);
      if (old && JSON.stringify(old) !== JSON.stringify(item)) {
        targetsCrud.update.mutate({
          id: item.id,
          data: { asset_class: item.asset_class ?? item.class, target: item.target, icon: item.icon || '' },
        });
      }
    }
  }, [targets, targetsCrud]);

  const setAccumulationGoals = useCallback((updater) => {
    const prev = accumulationGoals;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevIds = new Set(prev.map(g => g.id));
    const nextIds = new Set(next.map(g => g.id));
    for (const item of next.filter(g => !prevIds.has(g.id))) {
      accGoalsCrud.create.mutate(toSnakeCase(item, 'accGoal'));
    }
    for (const item of prev.filter(g => !nextIds.has(g.id))) {
      accGoalsCrud.remove.mutate(item.id);
    }
    for (const item of next.filter(g => prevIds.has(g.id))) {
      const old = prev.find(g => g.id === item.id);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        accGoalsCrud.update.mutate({ id: item.id, data: toSnakeCase(item, 'accGoal') });
      }
    }
  }, [accumulationGoals, accGoalsCrud]);

  const setFiEtfs = useCallback((updater) => {
    const prev = fiEtfs;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevTickers = new Set(prev.map(e => e.ticker));
    const nextTickers = new Set(next.map(e => e.ticker));
    for (const item of next.filter(e => !prevTickers.has(e.ticker))) {
      fiEtfsCrud.create.mutate(toSnakeCase(item, 'fiEtf'));
    }
    for (const item of prev.filter(e => !nextTickers.has(e.ticker))) {
      fiEtfsCrud.remove.mutate(item.ticker);
    }
    for (const item of next.filter(e => prevTickers.has(e.ticker))) {
      const old = prev.find(e => e.ticker === item.ticker);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        fiEtfsCrud.update.mutate({ id: item.ticker, data: toSnakeCase(item, 'fiEtf') });
      }
    }
  }, [fiEtfs, fiEtfsCrud]);

  const setCashAccounts = useCallback((updater) => {
    const prev = cashAccounts;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const prevIds = new Set(prev.map(a => a.id));
    const nextIds = new Set(next.map(a => a.id));
    for (const item of next.filter(a => !prevIds.has(a.id))) {
      cashAccountsCrud.create.mutate(toSnakeCase(item, 'cashAccount'));
    }
    for (const item of prev.filter(a => !nextIds.has(a.id))) {
      cashAccountsCrud.remove.mutate(item.id);
    }
    for (const item of next.filter(a => prevIds.has(a.id))) {
      const old = prev.find(a => a.id === item.id);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        cashAccountsCrud.update.mutate({ id: item.id, data: toSnakeCase(item, 'cashAccount') });
      }
    }
  }, [cashAccounts, cashAccountsCrud]);

  const createTransaction = useCallback(async (txData) => {
    const payload = toSnakeCase(txData, 'transaction');
    return transactionsCrud.create.mutateAsync(payload);
  }, [transactionsCrud]);

  const resetData = useCallback(() => {
    resetMutation.mutate();
  }, [resetMutation]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value = {
    currency, setCurrency,
    brokerFilter, setBrokerFilter,
    brStocks: liveBrStocks, setBrStocks,
    fiis: liveFiis, setFiis,
    intlStocks, setIntlStocks,
    fixedIncome, setFixedIncome,
    fiEtfs: liveFiEtfs, setFiEtfs,
    cashAccounts, setCashAccounts,
    realAssets, setRealAssets,
    dividends, setDividends,
    watchlist, setWatchlist,
    targets, setTargets,
    accumulationGoals, setAccumulationGoals,
    transactions, transactionsCrud, createTransaction,
    brStocksCrud, fiisCrud, intlStocksCrud, fixedIncomeCrud,
    fiEtfsCrud, cashAccountsCrud, realAssetsCrud,
    accumulationHistory,
    exchangeRate,
    allocation,
    totalPatrimony,
    dividendsSummary,
    watchlistAlerts,
    patrimonialHistory,
    benchmarks,
    marketDataStatus,
    resetData,
    b3Import,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
