from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.cash_account import CashAccount
from ..schemas.cash_account import CashAccountCreate, CashAccountUpdate, CashAccountRead

router = APIRouter(prefix="/api/cash-accounts", tags=["cash-accounts"])


@router.get("", response_model=list[CashAccountRead])
async def list_cash_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CashAccount).order_by(CashAccount.name))
    return result.scalars().all()


@router.post("", response_model=CashAccountRead, status_code=201)
async def create_cash_account(data: CashAccountCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(CashAccount, data.id)
    if existing:
        raise HTTPException(409, f"ID {data.id} already exists")
    obj = CashAccount(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=CashAccountRead)
async def get_cash_account(item_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(CashAccount, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    return obj


@router.put("/{item_id}", response_model=CashAccountRead)
async def update_cash_account(item_id: str, data: CashAccountUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(CashAccount, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_cash_account(item_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(CashAccount, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    await db.delete(obj)
    await db.commit()
