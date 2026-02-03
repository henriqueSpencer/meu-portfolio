from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import async_session
from .routers import (
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
)
from .routers.seed import _is_empty, run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed database if empty
    async with async_session() as db:
        if await _is_empty(db):
            await run_seed(db)
            print("[seed] Database seeded with initial data")
        else:
            print("[seed] Database already has data, skipping seed")
    yield


app = FastAPI(title="Dash Financeiro API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
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


@app.get("/api/health")
async def health():
    return {"status": "ok"}
