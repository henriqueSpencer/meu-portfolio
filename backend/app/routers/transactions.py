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
from ..models.fi_etf import FiEtf
from ..models.cash_account import CashAccount
from ..schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate

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
    "fi_etf": (FiEtf, "ticker"),
    "cash_account": (CashAccount, "id"),
}

VALID_OPS = {
    "br_stock": {"compra", "venda", "transferencia", "desdobramento", "bonificacao"},
    "fii": {"compra", "venda", "transferencia", "desdobramento", "bonificacao"},
    "intl_stock": {"compra", "venda", "transferencia", "desdobramento", "bonificacao"},
    "fixed_income": {"aporte", "resgate", "transferencia"},
    "real_asset": {"compra", "venda"},
    "fi_etf": {"compra", "venda", "transferencia", "desdobramento", "bonificacao"},
    "cash_account": {"aporte", "resgate", "transferencia"},
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

    if cls in ("br_stock", "fii", "fi_etf"):
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

    elif cls == "cash_account":
        if op == "aporte":
            asset.balance = (asset.balance or 0) + (tx.total_value or 0)
        elif op == "resgate":
            asset.balance = (asset.balance or 0) - (tx.total_value or 0)
        elif op == "transferencia":
            if tx.broker_destination:
                asset.institution = tx.broker_destination


async def _revert(db: AsyncSession, tx):
    """Revert a transaction's effect (inverse of _apply)."""
    asset = await _get_asset(db, tx)
    if not asset:
        return

    op = tx.operation_type
    cls = tx.asset_class

    if cls in ("br_stock", "fii", "fi_etf"):
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

    elif cls == "cash_account":
        if op == "aporte":
            asset.balance = (asset.balance or 0) - (tx.total_value or 0)
        elif op == "resgate":
            asset.balance = (asset.balance or 0) + (tx.total_value or 0)
        elif op == "transferencia":
            if tx.broker:
                asset.institution = tx.broker


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[TransactionRead])
async def list_transactions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc()))
    return result.scalars().all()


@router.post("", response_model=TransactionRead, status_code=201)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    valid = VALID_OPS.get(data.asset_class)
    if valid and data.operation_type not in valid:
        raise HTTPException(422, f"Invalid operation '{data.operation_type}' for {data.asset_class}")
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


@router.put("/{transaction_id}", response_model=TransactionRead)
async def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Transaction, transaction_id)
    if not obj:
        raise HTTPException(404, f"Transaction {transaction_id} not found")
    # Revert the old state
    await _revert(db, obj)
    # Apply updates
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obj, field, value)
    # Validate operation
    valid = VALID_OPS.get(obj.asset_class)
    if valid and obj.operation_type not in valid:
        raise HTTPException(422, f"Invalid operation '{obj.operation_type}' for {obj.asset_class}")
    # Apply new state
    await _apply(db, obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Transaction, transaction_id)
    if not obj:
        raise HTTPException(404, f"Transaction {transaction_id} not found")
    await _revert(db, obj)
    await db.delete(obj)
    await db.commit()
