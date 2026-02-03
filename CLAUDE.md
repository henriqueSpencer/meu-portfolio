# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

```
dash_financeiro/
├── docker-compose.yml        # Orchestrates db + backend + frontend
├── .env.example              # Environment variables template
├── frontend/                 # React SPA
│   ├── Dockerfile            # Multi-stage: node build -> nginx
│   ├── nginx.conf            # Static serve + /api proxy -> backend
│   ├── package.json
│   ├── vite.config.js        # /api proxy for dev mode
│   └── src/
└── backend/                  # FastAPI + PostgreSQL
    ├── Dockerfile            # python:3.12-slim + alembic + uvicorn
    ├── requirements.txt
    ├── alembic.ini
    ├── alembic/              # DB migrations
    └── app/                  # FastAPI application
```

## Commands

### Docker (full stack)

- `docker compose up --build` — Build and start all 3 services (db, backend, frontend)
- `docker compose down` — Stop all services
- `docker compose down -v` — Stop and delete database volume

### Frontend (standalone dev)

- `cd frontend && npm run dev` — Vite dev server at http://localhost:5173 (proxies /api to localhost:8000)
- `cd frontend && npm run build` — Production build to `frontend/dist/`
- `cd frontend && npm run lint` — ESLint check
- `cd frontend && npm run preview` — Preview production build

### Backend (standalone dev)

- `cd backend && pip install -r requirements.txt` — Install Python dependencies
- `cd backend && alembic upgrade head` — Run DB migrations
- `cd backend && uvicorn app.main:app --reload` — Start FastAPI at http://localhost:8000

No test framework is configured yet.

## Stack

### Frontend
- **React 19** with JSX (no TypeScript)
- **Vite 7** with `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin
- **TanStack Query 5** for server state (CRUD + market data)
- **Recharts 3** for charts
- **Lucide React** for icons

### Backend
- **FastAPI** with async endpoints
- **SQLAlchemy 2** (async) with asyncpg driver
- **PostgreSQL 16** via Docker
- **Alembic** for database migrations
- **Pydantic v2** for request/response schemas
- **yfinance** for market data (Yahoo Finance — no API key needed)
- **httpx** for external API calls (BCB)

## Architecture

Personal investment tracking dashboard. Monorepo with Docker Compose orchestration.

### Data flow

```
PostgreSQL -> Backend (FastAPI) -> Frontend (React + TanStack Query)
                 |
                 └── yfinance (Yahoo Finance) / BCB (market data proxy)
```

1. **Backend** serves REST API at `/api/*`. On first start, seeds the database with demo data if empty.
2. **Frontend** fetches data via `src/services/api.js` which calls `/api/*` endpoints. `src/hooks/usePortfolio.js` wraps each entity in TanStack Query CRUD hooks.
3. **AppContext.jsx** consumes the portfolio hooks, computes derived values (allocation, totals, dividends summary), and exposes setter-compatible wrappers that translate `setState`-style calls into API mutations.
4. **Tab components** consume `useApp()` exactly as before — the CRUD interface (`setBrStocks`, `setFiis`, etc.) is preserved as a compatibility layer.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/br-stocks` | List / create BR stocks |
| GET/PUT/DELETE | `/api/br-stocks/{ticker}` | Read / update / delete |
| GET/POST | `/api/fiis` | List / create FIIs |
| GET/PUT/DELETE | `/api/fiis/{ticker}` | Read / update / delete |
| GET/POST | `/api/intl-stocks` | List / create intl stocks |
| GET/PUT/DELETE | `/api/intl-stocks/{ticker}` | Read / update / delete |
| GET/POST | `/api/fixed-income` | List / create fixed income |
| GET/PUT/DELETE | `/api/fixed-income/{id}` | Read / update / delete |
| GET/POST | `/api/real-assets` | List / create real assets |
| GET/PUT/DELETE | `/api/real-assets/{id}` | Read / update / delete |
| GET/POST | `/api/dividends` | List / create dividends |
| GET/PUT/DELETE | `/api/dividends/{id}` | Read / update / delete |
| GET/POST | `/api/watchlist` | List / create watchlist |
| GET/PUT/DELETE | `/api/watchlist/{ticker}` | Read / update / delete |
| GET/POST | `/api/allocation-targets` | List / create targets |
| PUT/DELETE | `/api/allocation-targets/{id}` | Update / delete |
| GET/POST | `/api/accumulation-goals` | List / create goals |
| GET/PUT/DELETE | `/api/accumulation-goals/{id}` | Read / update / delete |
| GET | `/api/patrimonial-history` | List patrimonial history |
| GET | `/api/market-data/quotes?tickers=X,Y` | Live BR quotes (yfinance, adds .SA suffix) |
| GET | `/api/market-data/quotes/intl?tickers=X,Y` | Live intl quotes (yfinance) |
| GET | `/api/market-data/exchange-rate` | USD/BRL PTAX rate (BCB) |
| GET | `/api/market-data/indicators` | SELIC, CDI, IPCA |
| POST | `/api/seed/reset` | Reset DB to seed data |
| GET | `/api/seed/static` | Benchmarks + accumulation history |
| GET | `/api/health` | Health check |

### Key conventions

- **Snake_case API, camelCase UI**: Backend uses snake_case (`avg_price`). Frontend tabs use camelCase (`avgPrice`). The `AppContext.jsx` setter wrappers handle translation via `src/utils/apiHelpers.js`.
- **Glass-card styling**: `.glass-card` CSS class in `index.css` or local `GLASS` constant.
- **Currency formatting**: `formatCurrency(value, currency, exchangeRate)` from `src/utils/formatters.js`.
- **Financial calculations**: `src/utils/calculations.js` — Graham, Bazin, allocation, suggestions.
- **Dark mode only**: Background `#0b0f1a`, text `#e2e8f0`. Accents: indigo, purple, cyan. Semantic: emerald (positive), red (negative), amber (warning).
- **Tab routing**: State-driven via `App.jsx` TAB_COMPONENTS map. No router.

### ESLint

The `no-unused-vars` rule ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`).

### Environment Variables

Configured in `.env` at the project root (used by `docker-compose.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `dash` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `dash` | PostgreSQL password |
| `POSTGRES_DB` | `dash_financeiro` | Database name |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |
| `BACKEND_PORT` | `8000` | Backend exposed port |
| `FRONTEND_PORT` | `3000` | Frontend exposed port (nginx) |
