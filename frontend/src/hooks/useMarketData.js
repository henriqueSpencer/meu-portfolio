// ========================================================
// TanStack Query hooks for live market data (via backend proxy)
// ========================================================

import { useQuery } from '@tanstack/react-query';
import { fetchBrQuotes, fetchExchangeRate, fetchHistoricalRates, fetchFundamentals } from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if B3 is likely open (Mon-Fri 10:00-17:00 BRT). */
function isB3Open() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 10 && hour < 17;
}

// ---------------------------------------------------------------------------
// BR stocks + FIIs (batch via backend -> brapi.dev)
// ---------------------------------------------------------------------------

export function useBrQuotes(tickers) {
  const tickerString = tickers.join(',');

  return useQuery({
    queryKey: ['br-quotes', tickerString],
    queryFn: () => fetchBrQuotes(tickers),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: isB3Open() ? 15 * 60 * 1000 : false,
    refetchOnWindowFocus: true,
    enabled: tickers.length > 0,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
}

// ---------------------------------------------------------------------------
// Exchange rate USD/BRL (via backend -> BCB PTAX)
// ---------------------------------------------------------------------------

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate-bcb'],
    queryFn: fetchExchangeRate,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// ---------------------------------------------------------------------------
// Fundamentals (LPA, VPA, P/VP, DY, dividends)
// ---------------------------------------------------------------------------

export function useBrFundamentals(tickers) {
  const tickerString = tickers.join(',');

  return useQuery({
    queryKey: ['br-fundamentals', tickerString],
    queryFn: () => fetchFundamentals(tickers, 'br'),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    enabled: tickers.length > 0,
    retry: 1,
  });
}

export function useIntlFundamentals(tickers) {
  const tickerString = tickers.join(',');

  return useQuery({
    queryKey: ['intl-fundamentals', tickerString],
    queryFn: () => fetchFundamentals(tickers, 'intl'),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    enabled: tickers.length > 0,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// BCB Historical Series (CDI daily=12, IPCA monthly=433, Selic daily=11)
// ---------------------------------------------------------------------------

export function useHistoricalRates(seriesCodes, startDate, endDate) {
  return useQuery({
    queryKey: ['historical-rates', seriesCodes, startDate, endDate],
    queryFn: () => fetchHistoricalRates(seriesCodes, startDate, endDate),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!(seriesCodes?.length && startDate && endDate),
    retry: 2,
  });
}
