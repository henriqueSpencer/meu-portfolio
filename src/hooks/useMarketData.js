// ========================================================
// TanStack Query hooks for live market data
// ========================================================

import { useQuery } from '@tanstack/react-query';
import { fetchBrQuotes, fetchExchangeRate } from '../services/api';

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if B3 is likely open (Mon–Fri 10:00–17:00 BRT). */
function isB3Open() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 10 && hour < 17;
}

// ---------------------------------------------------------------------------
// BR stocks + FIIs (batch via brapi.dev)
// ---------------------------------------------------------------------------

/**
 * Fetches live prices for an array of B3 tickers.
 * Only enabled when VITE_BRAPI_TOKEN is set.
 * Polls every 15 min during market hours; pauses outside.
 */
export function useBrQuotes(tickers) {
  const tickerString = tickers.join(',');

  return useQuery({
    queryKey: ['br-quotes', tickerString],
    queryFn: () => fetchBrQuotes(tickers),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: isB3Open() ? 15 * 60 * 1000 : false,
    refetchOnWindowFocus: true,
    enabled: tickers.length > 0 && !!BRAPI_TOKEN,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
}

// ---------------------------------------------------------------------------
// Exchange rate USD/BRL (BCB PTAX — no auth needed)
// ---------------------------------------------------------------------------

/**
 * Fetches the official USD/BRL PTAX rate from BCB.
 * Refreshes every hour.
 */
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
