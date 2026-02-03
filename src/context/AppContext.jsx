import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  brStocks as defaultBrStocks,
  fiis as defaultFiis,
  intlStocks as defaultIntlStocks,
  fixedIncome as defaultFixedIncome,
  realAssets as defaultRealAssets,
  dividendHistory as defaultDividends,
  watchlistData as defaultWatchlist,
  allocationTargets as defaultTargets,
  accumulationGoals as defaultAccumulationGoals,
  accumulationHistory,
  patrimonialHistory,
  benchmarks,
  EXCHANGE_RATE,
} from '../data/mockData';
import { calculateAllocation } from '../utils/calculations';
import { useBrQuotes, useExchangeRate } from '../hooks/useMarketData';

const AppContext = createContext();

const STORAGE_KEY = 'dash_financeiro_data';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Erro ao carregar dados do localStorage:', e);
  }
  return null;
}

export function AppProvider({ children }) {
  const stored = loadFromStorage();

  const [currency, setCurrency] = useState('BRL');
  const [brokerFilter, setBrokerFilter] = useState('Todas');
  const [brStocks, setBrStocks] = useState(stored?.brStocks || defaultBrStocks);
  const [fiis, setFiis] = useState(stored?.fiis || defaultFiis);
  const [intlStocks, setIntlStocks] = useState(stored?.intlStocks || defaultIntlStocks);
  const [fixedIncome, setFixedIncome] = useState(stored?.fixedIncome || defaultFixedIncome);
  const [realAssets, setRealAssets] = useState(stored?.realAssets || defaultRealAssets);
  const [dividends, setDividends] = useState(stored?.dividends || defaultDividends);
  const [watchlist, setWatchlist] = useState(stored?.watchlist || defaultWatchlist);
  const [targets, setTargets] = useState(stored?.targets || defaultTargets);
  const [accumulationGoals, setAccumulationGoals] = useState(stored?.accumulationGoals || defaultAccumulationGoals);

  // ---------------------------------------------------------------------------
  // Live market data (TanStack Query hooks)
  // ---------------------------------------------------------------------------
  const brTickers = useMemo(() => [
    ...brStocks.map(s => s.ticker),
    ...fiis.map(f => f.ticker),
  ], [brStocks, fiis]);

  const quotesQuery = useBrQuotes(brTickers);
  const exchangeRateQuery = useExchangeRate();

  // Exchange rate: live BCB PTAX -> fallback to hardcoded
  const exchangeRate = exchangeRateQuery.data ?? EXCHANGE_RATE;

  // Build a price map from live API data (derived, no setState)
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

  // Overlay live prices onto the base state arrays (pure derivation)
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

  // Market data status (exposed to UI for freshness indicator)
  const marketDataStatus = useMemo(() => ({
    quotesUpdatedAt: quotesQuery.dataUpdatedAt || null,
    quotesIsLoading: quotesQuery.isLoading,
    quotesIsError: quotesQuery.isError,
    quotesEnabled: !!import.meta.env.VITE_BRAPI_TOKEN,
    exchangeRateUpdatedAt: exchangeRateQuery.dataUpdatedAt || null,
    exchangeRateLive: exchangeRateQuery.data != null,
  }), [
    quotesQuery.dataUpdatedAt,
    quotesQuery.isLoading,
    quotesQuery.isError,
    exchangeRateQuery.dataUpdatedAt,
    exchangeRateQuery.data,
  ]);

  // Persistência no localStorage
  useEffect(() => {
    const data = { brStocks, fiis, intlStocks, fixedIncome, realAssets, dividends, watchlist, targets, accumulationGoals };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [brStocks, fiis, intlStocks, fixedIncome, realAssets, dividends, watchlist, targets, accumulationGoals]);

  // Calculos derivados (use live arrays for current-price-dependent calculations)
  const allocation = useMemo(
    () => calculateAllocation(liveBrStocks, liveFiis, intlStocks, fixedIncome, exchangeRate),
    [liveBrStocks, liveFiis, intlStocks, fixedIncome, exchangeRate]
  );

  const totalPatrimony = useMemo(() => {
    const financial = allocation.total;
    const immobilized = realAssets
      .filter(a => a.includeInTotal)
      .reduce((sum, a) => sum + a.estimatedValue, 0);
    return financial + immobilized;
  }, [allocation, realAssets]);

  // Proventos do mês atual e do ano
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

  // Alertas da watchlist (ativo atingiu preço-alvo)
  const watchlistAlerts = useMemo(
    () => watchlist.filter(w => w.currentPrice <= w.targetPrice),
    [watchlist]
  );

  const resetData = useCallback(() => {
    setBrStocks(defaultBrStocks);
    setFiis(defaultFiis);
    setIntlStocks(defaultIntlStocks);
    setFixedIncome(defaultFixedIncome);
    setRealAssets(defaultRealAssets);
    setDividends(defaultDividends);
    setWatchlist(defaultWatchlist);
    setTargets(defaultTargets);
    setAccumulationGoals(defaultAccumulationGoals);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    currency, setCurrency,
    brokerFilter, setBrokerFilter,
    brStocks: liveBrStocks, setBrStocks,
    fiis: liveFiis, setFiis,
    intlStocks, setIntlStocks,
    fixedIncome, setFixedIncome,
    realAssets, setRealAssets,
    dividends, setDividends,
    watchlist, setWatchlist,
    targets, setTargets,
    accumulationGoals, setAccumulationGoals,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
