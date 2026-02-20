// ========================================================
// API service — calls backend at /api/*
// ========================================================

const BASE = '/api';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

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
// Token refresh
// ---------------------------------------------------------------------------

let refreshPromise = null;

async function tryRefreshToken() {
  if (refreshPromise) return refreshPromise;

  const refresh = getRefreshToken();
  if (!refresh) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setTokens(data.access_token, null);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Callback for triggering re-login modal (set by AuthContext)
let onAuthError = null;
export function setOnAuthError(fn) {
  onAuthError = fn;
}

// ---------------------------------------------------------------------------
// Base request helper
// ---------------------------------------------------------------------------

async function request(path, options = {}) {
  const token = getAccessToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${BASE}${path}`, { ...options, headers });
    }
  }

  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail || `API ${res.status}: ${res.statusText}`);
    err.status = res.status;
    if (res.status === 401 && onAuthError) {
      onAuthError();
    }
    throw err;
  }
  const data = await res.json();
  return options.raw ? data : camelizeKeys(data);
}

// Authenticated fetch for file uploads
async function authFetch(url, options = {}) {
  const token = getAccessToken();
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.detail || 'Login falhou');
    err.status = res.status;
    throw err;
  }
  return camelizeKeys(data);
}

export async function apiRegister(email, password, name) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.detail || 'Cadastro falhou');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function apiGoogleAuth(credential) {
  const res = await fetch(`${BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.detail || 'Google login falhou');
    err.status = res.status;
    throw err;
  }
  return camelizeKeys(data);
}

export async function apiVerifyEmail(token) {
  return request(`/auth/verify-email?token=${token}`);
}

export async function apiGetMe() {
  return request('/auth/me');
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export const usersApi = {
  list: () => request('/users'),
  listPending: () => request('/users/pending'),
  update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approve: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const adminApi = {
  metrics: () => request('/admin/metrics'),
  logs: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.userId) qs.set('user_id', params.userId);
    if (params.limit) qs.set('limit', params.limit);
    if (params.offset) qs.set('offset', params.offset);
    const q = qs.toString();
    return request(`/admin/logs${q ? '?' + q : ''}`);
  },
};

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

export async function fetchFundamentals(tickers, market = 'br') {
  if (!tickers || tickers.length === 0) return null;
  const data = await request(
    `/market-data/fundamentals?tickers=${tickers.join(',')}&market=${market}`,
  );
  return data.results || {};
}

export async function updateSectors() {
  return request('/market-data/update-sectors', { method: 'POST' });
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
  const res = await authFetch(`${BASE}/import/b3/preview`, {
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

// ---------------------------------------------------------------------------
// B3 Movimentacao Import
// ---------------------------------------------------------------------------

export async function uploadB3MovPreview(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch(`${BASE}/import/b3-mov/preview`, {
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

export async function confirmB3MovImport(rows) {
  const snakeRows = rows.map(r => ({
    date: r.date,
    direction: r.direction,
    movement_type: r.movementType,
    product: r.product,
    institution: r.institution,
    qty: r.qty,
    unit_price: r.unitPrice,
    total_value: r.totalValue,
    category: r.category,
    import_as: r.importAs,
    ticker: r.ticker,
    asset_name: r.assetName,
    asset_class: r.assetClass,
    rf_type: r.rfType,
    rf_code: r.rfCode,
    is_duplicate: r.isDuplicate,
    is_skipped: r.isSkipped,
    skip_reason: r.skipReason,
  }));
  return request('/import/b3-mov/confirm', {
    method: 'POST',
    body: JSON.stringify({ rows: snakeRows }),
  });
}

// ---------------------------------------------------------------------------
// Portfolio Reset & Export
// ---------------------------------------------------------------------------

export async function exportPortfolio() {
  const res = await authFetch(`${BASE}/portfolio/export`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API ${res.status}: ${res.statusText}`);
  }
  const blob = await res.blob();
  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const disposition = res.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="(.+)"/);
  a.href = url;
  a.download = filenameMatch ? filenameMatch[1] : `backup_lancamentos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function resetPortfolio() {
  return request('/portfolio/reset', { method: 'POST', raw: true });
}

// ---------------------------------------------------------------------------
// Backup Import
// ---------------------------------------------------------------------------

export async function uploadBackupPreview(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch(`${BASE}/import/backup/preview`, {
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

// ---------------------------------------------------------------------------
// Closed Position Metrics
// ---------------------------------------------------------------------------

export async function fetchClosedPositionMetrics(assetClass) {
  return request(`/closed-position-metrics?asset_class=${assetClass}`, { raw: true });
}

export async function confirmBackupImport(rows) {
  const snakeRows = rows.map(r => ({
    date: r.date,
    operation_type: r.operationType,
    asset_class: r.assetClass,
    ticker: r.ticker,
    asset_id: r.assetId,
    asset_name: r.assetName,
    qty: r.qty,
    unit_price: r.unitPrice,
    total_value: r.totalValue,
    broker: r.broker,
    broker_destination: r.brokerDestination,
    fees: r.fees,
    notes: r.notes,
    is_duplicate: r.isDuplicate,
  }));
  return request('/import/backup/confirm', {
    method: 'POST',
    body: JSON.stringify({ rows: snakeRows }),
  });
}
