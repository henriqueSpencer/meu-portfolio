from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.transaction import Transaction
from ..models.br_stock import BrStock
from ..models.fii import Fii
from ..models.intl_stock import IntlStock
from ..models.fixed_income import FixedIncome
from ..models.real_asset import RealAsset
from ..schemas.transaction import TransactionCreate, TransactionRead

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


# ---------------------------------------------------------------------------
# Helpers: resolve the target asset from a transaction
# ---------------------------------------------------------------------------

MODEL_MAP = {
    "br_stock": (BrStock, "ticker"),
    "fii": (Fii, "ticker"),
    "intl_stock": (IntlStock, "ticker"),
    "fixed_income": (FixedIncome, "id"),
    "real_asset": (RealAsset, "id"),
}


async def _get_asset(db: AsyncSession, tx: Transaction | TransactionCreate):
    entry = MODEL_MAP.get(tx.asset_class)
    if not entry:
        return None
    model, key_field = entry
    if key_field == "ticker":
        pk = tx.ticker
    else:
        pk = tx.asset_id
    if not pk:
        return None
    return await db.get(model, pk.upper() if key_field == "ticker" else pk)


# ---------------------------------------------------------------------------
# Apply / revert position changes
# ---------------------------------------------------------------------------

async def _apply(db: AsyncSession, tx):
    """Apply a transaction's effect on the underlying asset position."""
    asset = await _get_asset(db, tx)
    if not asset:
        return

    op = tx.operation_type
    cls = tx.asset_class

    if cls in ("br_stock", "fii"):
        if op == "compra":
            old_qty = asset.qty or 0
            old_avg = asset.avg_price or 0
            new_qty = old_qty + (tx.qty or 0)
            if new_qty > 0:
                asset.avg_price = ((old_qty * old_avg) + ((tx.qty or 0) * (tx.unit_price or 0))) / new_qty
            asset.qty = int(new_qty)
        elif op == "venda":
            asset.qty = int((asset.qty or 0) - (tx.qty or 0))
        elif op == "transferencia":
            if tx.broker_destination:
                asset.broker = tx.broker_destination
        elif op == "desdobramento":
            factor = tx.qty or 1
            asset.qty = int((asset.qty or 0) * factor)
            if factor > 0:
                asset.avg_price = (asset.avg_price or 0) / factor
        elif op == "bonificacao":
            old_qty = asset.qty or 0
            old_avg = asset.avg_price or 0
            bonus_qty = tx.qty or 0
            new_qty = old_qty + bonus_qty
            if new_qty > 0:
                asset.avg_price = (old_qty * old_avg) / new_qty
            asset.qty = int(new_qty)

    elif cls == "intl_stock":
        if op == "compra":
            old_qty = asset.qty or 0
            old_avg = asset.avg_price_usd or 0
            new_qty = old_qty + (tx.qty or 0)
            if new_qty > 0:
                asset.avg_price_usd = ((old_qty * old_avg) + ((tx.qty or 0) * (tx.unit_price or 0))) / new_qty
            asset.qty = int(new_qty)
        elif op == "venda":
            asset.qty = int((asset.qty or 0) - (tx.qty or 0))
        elif op == "transferencia":
            if tx.broker_destination:
                asset.broker = tx.broker_destination
        elif op == "desdobramento":
            factor = tx.qty or 1
            asset.qty = int((asset.qty or 0) * factor)
            if factor > 0:
                asset.avg_price_usd = (asset.avg_price_usd or 0) / factor
        elif op == "bonificacao":
            old_qty = asset.qty or 0
            old_avg = asset.avg_price_usd or 0
            bonus_qty = tx.qty or 0
            new_qty = old_qty + bonus_qty
            if new_qty > 0:
                asset.avg_price_usd = (old_qty * old_avg) / new_qty
            asset.qty = int(new_qty)

    elif cls == "fixed_income":
        if op == "aporte":
            asset.applied_value = (asset.applied_value or 0) + (tx.total_value or 0)
            asset.current_value = (asset.current_value or 0) + (tx.total_value or 0)
        elif op == "resgate":
            asset.current_value = (asset.current_value or 0) - (tx.total_value or 0)
        elif op == "transferencia":
            if tx.broker_destination:
                asset.broker = tx.broker_destination

    elif cls == "real_asset":
        if op == "compra":
            asset.estimated_value = (asset.estimated_value or 0) + (tx.total_value or 0)
        elif op == "venda":
            asset.estimated_value = (asset.estimated_value or 0) - (tx.total_value or 0)


async def _revert(db: AsyncSession, tx):
    """Revert a transaction's effect (inverse of _apply)."""
    asset = await _get_asset(db, tx)
    if not asset:
        return

    op = tx.operation_type
    cls = tx.asset_class

    if cls in ("br_stock", "fii"):
        if op == "compra":
            cur_qty = asset.qty or 0
            cur_avg = asset.avg_price or 0
            tx_qty = tx.qty or 0
            old_qty = cur_qty - tx_qty
            if old_qty > 0:
                asset.avg_price = ((cur_qty * cur_avg) - (tx_qty * (tx.unit_price or 0))) / old_qty
            elif old_qty == 0:
                asset.avg_price = 0
            asset.qty = int(max(old_qty, 0))
        elif op == "venda":
            asset.qty = int((asset.qty or 0) + (tx.qty or 0))
        elif op == "transferencia":
            if tx.broker:
                asset.broker = tx.broker
        elif op == "desdobramento":
            factor = tx.qty or 1
            if factor > 0:
                asset.qty = int((asset.qty or 0) / factor)
                asset.avg_price = (asset.avg_price or 0) * factor
        elif op == "bonificacao":
            cur_qty = asset.qty or 0
            bonus_qty = tx.qty or 0
            old_qty = cur_qty - bonus_qty
            if old_qty > 0:
                asset.avg_price = ((asset.avg_price or 0) * cur_qty) / old_qty
            asset.qty = int(max(old_qty, 0))

    elif cls == "intl_stock":
        if op == "compra":
            cur_qty = asset.qty or 0
            cur_avg = asset.avg_price_usd or 0
            tx_qty = tx.qty or 0
            old_qty = cur_qty - tx_qty
            if old_qty > 0:
                asset.avg_price_usd = ((cur_qty * cur_avg) - (tx_qty * (tx.unit_price or 0))) / old_qty
            elif old_qty == 0:
                asset.avg_price_usd = 0
            asset.qty = int(max(old_qty, 0))
        elif op == "venda":
            asset.qty = int((asset.qty or 0) + (tx.qty or 0))
        elif op == "transferencia":
            if tx.broker:
                asset.broker = tx.broker
        elif op == "desdobramento":
            factor = tx.qty or 1
            if factor > 0:
                asset.qty = int((asset.qty or 0) / factor)
                asset.avg_price_usd = (asset.avg_price_usd or 0) * factor
        elif op == "bonificacao":
            cur_qty = asset.qty or 0
            bonus_qty = tx.qty or 0
            old_qty = cur_qty - bonus_qty
            if old_qty > 0:
                asset.avg_price_usd = ((asset.avg_price_usd or 0) * cur_qty) / old_qty
            asset.qty = int(max(old_qty, 0))

    elif cls == "fixed_income":
        if op == "aporte":
            asset.applied_value = (asset.applied_value or 0) - (tx.total_value or 0)
            asset.current_value = (asset.current_value or 0) - (tx.total_value or 0)
        elif op == "resgate":
            asset.current_value = (asset.current_value or 0) + (tx.total_value or 0)
        elif op == "transferencia":
            if tx.broker:
                asset.broker = tx.broker

    elif cls == "real_asset":
        if op == "compra":
            asset.estimated_value = (asset.estimated_value or 0) - (tx.total_value or 0)
        elif op == "venda":
            asset.estimated_value = (asset.estimated_value or 0) + (tx.total_value or 0)


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[TransactionRead])
async def list_transactions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc()))
    return result.scalars().all()


@router.post("", response_model=TransactionRead, status_code=201)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    obj = Transaction(**data.model_dump())
    db.add(obj)
    await _apply(db, obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{transaction_id}", response_model=TransactionRead)
async def get_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Transaction, transaction_id)
    if not obj:
        raise HTTPException(404, f"Transaction {transaction_id} not found")
    return obj


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Transaction, transaction_id)
    if not obj:
        raise HTTPException(404, f"Transaction {transaction_id} not found")
    await _revert(db, obj)
    await db.delete(obj)
    await db.commit()
