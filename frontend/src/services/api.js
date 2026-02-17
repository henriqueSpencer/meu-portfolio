// ========================================================
// API service — calls backend at /api/*
// ========================================================

const BASE = '/api';

// ---------------------------------------------------------------------------
// snake_case -> camelCase conversion
// ---------------------------------------------------------------------------

function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys(obj) {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), camelizeKeys(v)])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Base request helper
// ---------------------------------------------------------------------------

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  return options.raw ? data : camelizeKeys(data);
}

// ---------------------------------------------------------------------------
// Generic CRUD helpers
// ---------------------------------------------------------------------------

function crudFor(resource) {
  return {
    list: () => request(`/${resource}`),
    get: (id) => request(`/${resource}/${id}`),
    create: (data) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

export const brStocksApi = crudFor('br-stocks');
export const fiisApi = crudFor('fiis');
export const intlStocksApi = crudFor('intl-stocks');
export const fixedIncomeApi = crudFor('fixed-income');
export const realAssetsApi = crudFor('real-assets');
export const dividendsApi = crudFor('dividends');
export const watchlistApi = crudFor('watchlist');
export const allocationTargetsApi = crudFor('allocation-targets');
export const accumulationGoalsApi = crudFor('accumulation-goals');
export const fiEtfsApi = crudFor('fi-etfs');
export const cashAccountsApi = crudFor('cash-accounts');
export const transactionsApi = crudFor('transactions');
export const patrimonialHistoryApi = { list: () => request('/patrimonial-history') };

// ---------------------------------------------------------------------------
// Market data (proxied through backend)
// ---------------------------------------------------------------------------

export async function fetchBrQuotes(tickers) {
  if (!tickers || tickers.length === 0) return null;
  const data = await request(`/market-data/quotes?tickers=${tickers.join(',')}`, { raw: true });
  return data.results || [];
}

export async function fetchExchangeRate() {
  const data = await request('/market-data/exchange-rate', { raw: true });
  return data.rate;
}

export async function fetchIndicators() {
  return request('/market-data/indicators', { raw: true });
}

export async function fetchHistoricalRates(seriesCodes, startDate, endDate) {
  const series = seriesCodes.join(',');
  return request(
    `/market-data/historical-rates?series=${series}&start=${startDate}&end=${endDate}`,
    { raw: true }
  );
}

// ---------------------------------------------------------------------------
// Seed / static data
// ---------------------------------------------------------------------------

export async function resetSeed() {
  return request('/seed/reset', { method: 'POST', raw: true });
}

export async function fetchStaticData() {
  return request('/seed/static', { raw: true });
}

// ---------------------------------------------------------------------------
// B3 Import
// ---------------------------------------------------------------------------

export async function uploadB3Preview(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/import/b3/preview`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  return camelizeKeys(data);
}

export async function confirmB3Import(rows) {
  // Convert rows back to snake_case for the backend
  const snakeRows = rows.map(r => ({
    date: r.date,
    operation_type: r.operationType,
    market: r.market,
    asset_class: r.assetClass,
    ticker: r.ticker,
    qty: r.qty,
    unit_price: r.unitPrice,
    total_value: r.totalValue,
    broker: r.broker,
    asset_name: r.assetName,
    asset_exists: r.assetExists,
    is_duplicate: r.isDuplicate,
    is_skipped: r.isSkipped,
    skip_reason: r.skipReason,
  }));
  return request('/import/b3/confirm', {
    method: 'POST',
    body: JSON.stringify({ rows: snakeRows }),
  });
}
