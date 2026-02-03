from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    BrStock, Fii, IntlStock, FixedIncome, RealAsset,
    Dividend, WatchlistItem, AllocationTarget, AccumulationGoal,
    PatrimonialHistory, FiEtf, CashAccount,
)
from ..seed.seed_data import (
    BR_STOCKS, FIIS, INTL_STOCKS, FIXED_INCOME, REAL_ASSETS,
    DIVIDENDS, WATCHLIST, ALLOCATION_TARGETS, ACCUMULATION_GOALS,
    PATRIMONIAL_HISTORY, BENCHMARKS, ACCUMULATION_HISTORY,
    FI_ETFS, CASH_ACCOUNTS,
)

router = APIRouter(prefix="/api/seed", tags=["seed"])


async def _is_empty(db: AsyncSession) -> bool:
    result = await db.execute(select(BrStock).limit(1))
    return result.scalar_one_or_none() is None


async def run_seed(db: AsyncSession):
    for row in BR_STOCKS:
        db.add(BrStock(**row))
    for row in FIIS:
        db.add(Fii(**row))
    for row in INTL_STOCKS:
        db.add(IntlStock(**row))
    for row in FIXED_INCOME:
        db.add(FixedIncome(**row))
    for row in REAL_ASSETS:
        db.add(RealAsset(**row))
    for row in DIVIDENDS:
        db.add(Dividend(**row))
    for row in WATCHLIST:
        db.add(WatchlistItem(**row))
    for row in ALLOCATION_TARGETS:
        db.add(AllocationTarget(**row))
    for row in ACCUMULATION_GOALS:
        db.add(AccumulationGoal(**row))
    for row in FI_ETFS:
        db.add(FiEtf(**row))
    for row in CASH_ACCOUNTS:
        db.add(CashAccount(**row))
    for row in PATRIMONIAL_HISTORY:
        db.add(PatrimonialHistory(**row))
    await db.commit()


@router.post("/reset")
async def reset_seed(db: AsyncSession = Depends(get_db)):
    tables = [
        "transactions",
        "patrimonial_history", "accumulation_goals", "allocation_targets",
        "watchlist", "dividends", "real_assets", "fixed_income",
        "fi_etfs", "cash_accounts",
        "intl_stocks", "fiis", "br_stocks",
    ]
    for table in tables:
        await db.execute(text(f"DELETE FROM {table}"))
    # Reset sequences for auto-increment tables
    for seq in ["transactions_id_seq", "dividends_id_seq", "allocation_targets_id_seq", "patrimonial_history_id_seq"]:
        await db.execute(text(f"ALTER SEQUENCE IF EXISTS {seq} RESTART WITH 1"))
    await db.commit()
    await run_seed(db)
    return {"status": "ok", "message": "Database reset to seed data"}


@router.get("/static")
async def get_static_data():
    """Return static/constant data that doesn't live in DB (benchmarks, accumulation history, etc.)"""
    return {
        "benchmarks": BENCHMARKS,
        "accumulationHistory": ACCUMULATION_HISTORY,
    }
