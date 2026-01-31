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
  patrimonialHistory,
  benchmarks,
  EXCHANGE_RATE,
} from '../data/mockData';
import { calculateAllocation } from '../utils/calculations';

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
  const exchangeRate = EXCHANGE_RATE;

  // Persistência no localStorage
  useEffect(() => {
    const data = { brStocks, fiis, intlStocks, fixedIncome, realAssets, dividends, watchlist, targets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [brStocks, fiis, intlStocks, fixedIncome, realAssets, dividends, watchlist, targets]);

  // Cálculos derivados
  const allocation = useMemo(
    () => calculateAllocation(brStocks, fiis, intlStocks, fixedIncome, exchangeRate),
    [brStocks, fiis, intlStocks, fixedIncome, exchangeRate]
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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    currency, setCurrency,
    brokerFilter, setBrokerFilter,
    brStocks, setBrStocks,
    fiis, setFiis,
    intlStocks, setIntlStocks,
    fixedIncome, setFixedIncome,
    realAssets, setRealAssets,
    dividends, setDividends,
    watchlist, setWatchlist,
    targets, setTargets,
    exchangeRate,
    allocation,
    totalPatrimony,
    dividendsSummary,
    watchlistAlerts,
    patrimonialHistory,
    benchmarks,
    resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
