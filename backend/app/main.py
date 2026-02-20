from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import async_session
from .routers import (
    auth,
    users,
    admin,
    br_stocks,
    fiis,
    intl_stocks,
    fixed_income,
    real_assets,
    dividends,
    watchlist,
    allocation_targets,
    accumulation_goals,
    market_data,
    patrimonial_history,
    transactions,
    fi_etfs,
    cash_accounts,
    seed,
    import_b3,
    import_b3_movimentacao,
    portfolio_reset,
    import_backup,
    import_templates,
    closed_positions,
)
from .routers.seed import _is_empty, run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed database if empty (creates admin user + demo data)
    async with async_session() as db:
        if await _is_empty(db):
            await run_seed(db)
            print("[seed] Database seeded with initial data")
        else:
            print("[seed] Database already has data, skipping seed")
    yield


app = FastAPI(title="Dash Financeiro API", version="1.0.0", lifespan=lifespan)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth & admin routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)

# Entity routers
app.include_router(br_stocks.router)
app.include_router(fiis.router)
app.include_router(intl_stocks.router)
app.include_router(fixed_income.router)
app.include_router(real_assets.router)
app.include_router(dividends.router)
app.include_router(watchlist.router)
app.include_router(allocation_targets.router)
app.include_router(accumulation_goals.router)
app.include_router(market_data.router)
app.include_router(patrimonial_history.router)
app.include_router(transactions.router)
app.include_router(fi_etfs.router)
app.include_router(cash_accounts.router)
app.include_router(seed.router)
app.include_router(import_b3.router)
app.include_router(import_b3_movimentacao.router)
app.include_router(portfolio_reset.router)
app.include_router(import_backup.router)
app.include_router(import_templates.router)
app.include_router(closed_positions.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
