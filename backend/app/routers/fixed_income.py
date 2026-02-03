from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.fixed_income import FixedIncome
from ..schemas.fixed_income import FixedIncomeCreate, FixedIncomeUpdate, FixedIncomeRead

router = APIRouter(prefix="/api/fixed-income", tags=["fixed-income"])


@router.get("", response_model=list[FixedIncomeRead])
async def list_fixed_income(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FixedIncome).order_by(FixedIncome.maturity_date))
    return result.scalars().all()


@router.post("", response_model=FixedIncomeRead, status_code=201)
async def create_fixed_income(data: FixedIncomeCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(FixedIncome, data.id)
    if existing:
        raise HTTPException(409, f"ID {data.id} already exists")
    obj = FixedIncome(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=FixedIncomeRead)
async def get_fixed_income(item_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(FixedIncome, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    return obj


@router.put("/{item_id}", response_model=FixedIncomeRead)
async def update_fixed_income(item_id: str, data: FixedIncomeUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(FixedIncome, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_fixed_income(item_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(FixedIncome, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    await db.delete(obj)
    await db.commit()
