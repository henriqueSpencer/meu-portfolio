# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Docker (full stack)

- `docker compose up --build` — Build and start all 3 services (db, backend, frontend)
- `docker compose down` — Stop all services
- `docker compose down -v` — Stop and delete database volume

### Frontend (standalone dev)

- `cd frontend && npm run dev` — Vite dev server at http://localhost:5173 (proxies /api to localhost:8000)
- `cd frontend && npm run build` — Production build to `frontend/dist/`
- `cd frontend && npm run lint` — ESLint check

### Backend (standalone dev)

- `cd backend && pip install -r requirements.txt` — Install Python dependencies
- `cd backend && alembic upgrade head` — Run DB migrations
- `cd backend && uvicorn app.main:app --reload` — Start FastAPI at http://localhost:8000

No test framework is configured yet.

## Stack

### Frontend
- **React 19** with JSX (no TypeScript)
- **Vite 7** with `@vitejs/plugin-react` + `@tailwindcss/vite` (Tailwind CSS 4 native Vite plugin, not PostCSS)
- **TanStack Query 5** for server state (CRUD + market data)
- **Recharts 3** for charts, **Lucide React** for icons

### Backend
- **FastAPI** with async endpoints
- **SQLAlchemy 2** (async) with asyncpg driver
- **PostgreSQL 16** via Docker
- **Alembic** for migrations (auto-runs on backend startup via entrypoint)
- **Pydantic v2** for schemas (`model_config = {"from_attributes": True}` on all read schemas)
- **yfinance** for market data (no API key), **httpx** for BCB API calls

## Architecture

Personal investment tracking dashboard. Monorepo with Docker Compose orchestration.

### Data flow

```
PostgreSQL -> Backend (FastAPI /api/*) -> Frontend (React + TanStack Query)
                    |
                    └── yfinance (Yahoo Finance) / BCB (market data proxy)
```

### Three-layer frontend state

1. **TanStack Query** (`src/hooks/usePortfolio.js`): Generic `useCrud()` factory creates standard CRUD hooks per entity. `useTransactions()` invalidates ALL asset queries on mutation.
2. **AppContext** (`src/context/AppContext.jsx`): Wraps hooks, computes derived values (allocation, totals, dividends summary), merges live prices at read-time via `useMemo`. Exposes setter-compatible API (`setBrStocks`, `setFiis`, etc.) that performs smart JSON diffing to infer create/update/delete operations.
3. **Tab components**: Consume `useApp()` hook. 12 tabs registered via `TABS` array + `TAB_COMPONENTS` map in `App.jsx`.

### Adding a new entity (checklist)

1. Model: `backend/app/models/<entity>.py` (inherit from `Base`), export in `models/__init__.py`
2. Schemas: `backend/app/schemas/<entity>.py` (Create/Update/Read Pydantic models)
3. Router: `backend/app/routers/<entity>.py` (standard CRUD with `get_db` dependency)
4. Register: import + `app.include_router()` in `backend/app/main.py`
5. Migration: `cd backend && alembic revision --autogenerate -m "description"` then `alembic upgrade head`
6. Seed: add data to `backend/app/seed/seed_data.py`, update `run_seed()` in `routers/seed.py`
7. Frontend: add hook in `usePortfolio.js`, wire into `AppContext.jsx`, create tab component

### Transaction system

Transactions (`/api/transactions`) are immutable (no PUT endpoint). Creating a transaction auto-updates the linked asset position (qty, avg_price) via `_apply()`. Deleting reverses via `_revert()`. Asset resolution uses `MODEL_MAP` dict mapping asset classes to their SQLAlchemy models. Supports 7 operation types: compra, venda, aporte, resgate, transferencia, desdobramento, bonificacao.

### Market data strategy

- **BR quotes**: `useBrQuotes()` batches tickers, auto-refetches every 15 min during B3 hours (Mon-Fri 10-17 BRT). Backend adds `.SA` suffix for yfinance.
- **Exchange rate**: `useExchangeRate()` fetches USD/BRL PTAX hourly from BCB. Fallback: `FALLBACK_EXCHANGE_RATE = 6.05`.
- **Indicators**: SELIC (series 4189), CDI (4391), IPCA (433) from BCB public API.
- Live prices merge into portfolio data at read-time — database values stay unchanged as fallback.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/br-stocks` | BR stocks |
| GET/PUT/DELETE | `/api/br-stocks/{ticker}` | |
| GET/POST | `/api/fiis` | FIIs |
| GET/PUT/DELETE | `/api/fiis/{ticker}` | |
| GET/POST | `/api/intl-stocks` | Intl stocks |
| GET/PUT/DELETE | `/api/intl-stocks/{ticker}` | |
| GET/POST | `/api/fixed-income` | Fixed income |
| GET/PUT/DELETE | `/api/fixed-income/{id}` | |
| GET/POST | `/api/fi-etfs` | FI ETFs |
| GET/PUT/DELETE | `/api/fi-etfs/{ticker}` | |
| GET/POST | `/api/cash-accounts` | Cash accounts |
| GET/PUT/DELETE | `/api/cash-accounts/{id}` | |
| GET/POST | `/api/real-assets` | Real assets |
| GET/PUT/DELETE | `/api/real-assets/{id}` | |
| GET/POST | `/api/dividends` | Dividends |
| GET/PUT/DELETE | `/api/dividends/{id}` | |
| GET/POST | `/api/transactions` | Transactions (no PUT) |
| GET/DELETE | `/api/transactions/{id}` | |
| GET/POST | `/api/watchlist` | Watchlist |
| GET/PUT/DELETE | `/api/watchlist/{ticker}` | |
| GET/POST | `/api/allocation-targets` | Allocation targets |
| PUT/DELETE | `/api/allocation-targets/{id}` | |
| GET/POST | `/api/accumulation-goals` | Accumulation goals |
| GET/PUT/DELETE | `/api/accumulation-goals/{id}` | |
| GET | `/api/patrimonial-history` | Patrimonial history |
| GET | `/api/market-data/quotes?tickers=X,Y` | BR quotes (yfinance, .SA suffix) |
| GET | `/api/market-data/quotes/intl?tickers=X,Y` | Intl quotes (yfinance) |
| GET | `/api/market-data/exchange-rate` | USD/BRL PTAX (BCB) |
| GET | `/api/market-data/indicators` | SELIC, CDI, IPCA (BCB) |
| GET | `/api/market-data/historical-rates` | BCB historical series |
| POST | `/api/seed/reset` | Reset DB to seed data (resets sequences) |
| GET | `/api/seed/static` | Benchmarks + accumulation history (no DB) |
| GET | `/api/health` | Health check |

## Key Conventions

- **Snake_case API, camelCase UI**: Backend snake_case → `camelizeKeys()` in `src/services/api.js` on responses. Frontend camelCase → `toSnakeCase()` in `src/utils/apiHelpers.js` on requests. AppContext setters handle translation.
- **Dark mode only**: Background `#0b0f1a`, text `#e2e8f0`. Accents: indigo, purple, cyan. Semantic: emerald (positive), red (negative), amber (warning).
- **Glass-card styling**: `.glass-card` CSS class in `index.css`.
- **Currency formatting**: `formatCurrency(value, currency, exchangeRate)` from `src/utils/formatters.js`.
- **Financial calculations**: `src/utils/calculations.js` — Graham (`sqrt(22.5 * LPA * VPA)`), Bazin (`median(dividends_5y) / 0.06`), allocation (includes FI ETFs in "Renda Fixa", cash accounts in "Caixa"), contribution suggestions.
- **Tab routing**: State-driven via `App.jsx` TAB_COMPONENTS map. No router library.
- **ESLint**: Flat config (`eslint.config.js`). `no-unused-vars` ignores vars starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`).

## Docker Services

```
db (postgres:16-alpine) → healthcheck: pg_isready
  ↓
backend (python:3.12-slim) → entrypoint: alembic upgrade head && uvicorn
  ↓                          healthcheck: curl /api/health
frontend (nginx:alpine)    → proxies /api/ to backend:8000
                             SPA fallback for client routes
```

Network: `dashnet` bridge. Volume: `postgres_data` for DB persistence. All services: `unless-stopped` restart policy.

## Environment Variables

Configured in `.env` at project root (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `dash` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `dash` | PostgreSQL password |
| `POSTGRES_DB` | `dash_financeiro` | Database name |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |
| `BACKEND_PORT` | `8000` | Backend exposed port |
| `FRONTEND_PORT` | `3000` | Frontend exposed port (nginx) |
