// ========================================================
// API service — brapi.dev (BR stocks/FIIs) + BCB (câmbio/benchmarks)
// ========================================================

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN;
const BRAPI_BASE = 'https://brapi.dev/api';
const BCB_SGS_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// ---------------------------------------------------------------------------
// brapi.dev — Brazilian stocks & FIIs (batch)
// ---------------------------------------------------------------------------

/**
 * Fetches quotes for an array of B3 tickers in a single request.
 * Returns the `results` array from brapi or null if no token configured.
 */
export async function fetchBrQuotes(tickers) {
  if (!BRAPI_TOKEN || tickers.length === 0) return null;
  const url = `${BRAPI_BASE}/quote/${tickers.join(',')}?token=${BRAPI_TOKEN}&fundamental=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brapi ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (data.error) throw new Error(`brapi: ${data.message || data.error}`);
  return data.results || [];
}

// ---------------------------------------------------------------------------
// BCB SGS — Banco Central do Brasil (open data, no auth)
// ---------------------------------------------------------------------------

/**
 * Fetches the latest value for a BCB time series.
 * Common codes:
 *   1    = PTAX venda (USD/BRL)
 *   4189 = SELIC anualizada
 *   4391 = CDI mensal
 *   433  = IPCA mensal
 */
async function fetchBcbSeries(code) {
  const url = `${BCB_SGS_BASE}.${code}/dados/ultimos/1?formato=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCB series ${code}: ${res.status}`);
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`BCB series ${code}: empty`);
  return parseFloat(data[0].valor);
}

/**
 * USD/BRL exchange rate (PTAX venda — official rate).
 */
export async function fetchExchangeRate() {
  return fetchBcbSeries(1);
}

/**
 * SELIC annualized rate (%).
 */
export async function fetchSelic() {
  return fetchBcbSeries(4189);
}

/**
 * CDI monthly rate (%).
 */
export async function fetchCdi() {
  return fetchBcbSeries(4391);
}

/**
 * IPCA monthly rate (%).
 */
export async function fetchIpca() {
  return fetchBcbSeries(433);
}
