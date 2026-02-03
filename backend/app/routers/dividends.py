from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.dividend import Dividend
from ..schemas.dividend import DividendCreate, DividendUpdate, DividendRead

router = APIRouter(prefix="/api/dividends", tags=["dividends"])


@router.get("", response_model=list[DividendRead])
async def list_dividends(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dividend).order_by(Dividend.date.desc()))
    return result.scalars().all()


@router.post("", response_model=DividendRead, status_code=201)
async def create_dividend(data: DividendCreate, db: AsyncSession = Depends(get_db)):
    obj = Dividend(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{dividend_id}", response_model=DividendRead)
async def get_dividend(dividend_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Dividend, dividend_id)
    if not obj:
        raise HTTPException(404, f"Dividend {dividend_id} not found")
    return obj


@router.put("/{dividend_id}", response_model=DividendRead)
async def update_dividend(dividend_id: int, data: DividendUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Dividend, dividend_id)
    if not obj:
        raise HTTPException(404, f"Dividend {dividend_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{dividend_id}", status_code=204)
async def delete_dividend(dividend_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Dividend, dividend_id)
    if not obj:
        raise HTTPException(404, f"Dividend {dividend_id} not found")
    await db.delete(obj)
    await db.commit()
