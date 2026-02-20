from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import (
    BrStock, Fii, IntlStock, FixedIncome, RealAsset,
    Dividend, WatchlistItem, AllocationTarget, AccumulationGoal,
    PatrimonialHistory, FiEtf, CashAccount, Transaction, User,
)
from ..core.security import hash_password, require_admin
from ..routers.transactions import _apply
from ..seed.seed_data import (
    BR_STOCKS, FIIS, INTL_STOCKS, FIXED_INCOME, REAL_ASSETS,
    DIVIDENDS, WATCHLIST, ALLOCATION_TARGETS, ACCUMULATION_GOALS,
    PATRIMONIAL_HISTORY, BENCHMARKS, ACCUMULATION_HISTORY,
    FI_ETFS, CASH_ACCOUNTS, TRANSACTIONS, FIXED_INCOME_ADJUSTMENTS,
)

router = APIRouter(prefix="/api/seed", tags=["seed"])


async def _is_empty(db: AsyncSession) -> bool:
    result = await db.execute(select(User).limit(1))
    return result.scalar_one_or_none() is None


async def _create_admin(db: AsyncSession) -> User:
    """Create admin user from env settings, return the User."""
    admin = User(
        email=settings.admin_email,
        name="Administrador",
        hashed_password=hash_password(settings.admin_password),
        role="admin",
        is_active=True,
        email_verified=True,
        is_approved=True,
    )
    db.add(admin)
    await db.flush()
    return admin


async def run_seed(db: AsyncSession):
    # Create admin user first
    admin = await _create_admin(db)
    admin_id = admin.id

    # Seed assets (all with zero positions, scoped to admin)
    for row in BR_STOCKS:
        db.add(BrStock(**row, user_id=admin_id))
    for row in FIIS:
        db.add(Fii(**row, user_id=admin_id))
    for row in INTL_STOCKS:
        db.add(IntlStock(**row, user_id=admin_id))
    for row in FIXED_INCOME:
        db.add(FixedIncome(**row, user_id=admin_id))
    for row in REAL_ASSETS:
        db.add(RealAsset(**row, user_id=admin_id))
    for row in DIVIDENDS:
        db.add(Dividend(**row, user_id=admin_id))
    for row in WATCHLIST:
        db.add(WatchlistItem(**row, user_id=admin_id))
    for row in ALLOCATION_TARGETS:
        db.add(AllocationTarget(**row, user_id=admin_id))
    for row in ACCUMULATION_GOALS:
        db.add(AccumulationGoal(**row, user_id=admin_id))
    for row in FI_ETFS:
        db.add(FiEtf(**row, user_id=admin_id))
    for row in CASH_ACCOUNTS:
        db.add(CashAccount(**row, user_id=admin_id))
    for row in PATRIMONIAL_HISTORY:
        db.add(PatrimonialHistory(**row, user_id=admin_id))

    # Flush so assets exist before transactions reference them
    await db.flush()

    # Seed transactions and apply position changes
    for row in TRANSACTIONS:
        tx = Transaction(**row, user_id=admin_id)
        db.add(tx)
        await _apply(db, tx, admin_id)

    # Post-transaction adjustments (fixed income current_value includes yield)
    for fi_id, adjustments in FIXED_INCOME_ADJUSTMENTS.items():
        asset = await db.get(FixedIncome, fi_id)
        if asset:
            for field, value in adjustments.items():
                setattr(asset, field, value)

    await db.commit()


@router.post("/reset")
async def reset_seed(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
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

    # Re-seed with admin's user_id
    admin_id = admin.id

    for row in BR_STOCKS:
        db.add(BrStock(**row, user_id=admin_id))
    for row in FIIS:
        db.add(Fii(**row, user_id=admin_id))
    for row in INTL_STOCKS:
        db.add(IntlStock(**row, user_id=admin_id))
    for row in FIXED_INCOME:
        db.add(FixedIncome(**row, user_id=admin_id))
    for row in REAL_ASSETS:
        db.add(RealAsset(**row, user_id=admin_id))
    for row in DIVIDENDS:
        db.add(Dividend(**row, user_id=admin_id))
    for row in WATCHLIST:
        db.add(WatchlistItem(**row, user_id=admin_id))
    for row in ALLOCATION_TARGETS:
        db.add(AllocationTarget(**row, user_id=admin_id))
    for row in ACCUMULATION_GOALS:
        db.add(AccumulationGoal(**row, user_id=admin_id))
    for row in FI_ETFS:
        db.add(FiEtf(**row, user_id=admin_id))
    for row in CASH_ACCOUNTS:
        db.add(CashAccount(**row, user_id=admin_id))
    for row in PATRIMONIAL_HISTORY:
        db.add(PatrimonialHistory(**row, user_id=admin_id))
    await db.flush()

    for row in TRANSACTIONS:
        tx = Transaction(**row, user_id=admin_id)
        db.add(tx)
        await _apply(db, tx, admin_id)

    for fi_id, adjustments in FIXED_INCOME_ADJUSTMENTS.items():
        asset = await db.get(FixedIncome, fi_id)
        if asset:
            for field, value in adjustments.items():
                setattr(asset, field, value)

    await db.commit()
    return {"status": "ok", "message": "Database reset to seed data"}


@router.get("/static")
async def get_static_data():
    """Return static/constant data that doesn't live in DB (benchmarks, accumulation history, etc.)"""
    return {
        "benchmarks": BENCHMARKS,
        "accumulationHistory": ACCUMULATION_HISTORY,
    }
