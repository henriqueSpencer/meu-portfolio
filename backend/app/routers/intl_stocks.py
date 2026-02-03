from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.intl_stock import IntlStock
from ..schemas.intl_stock import IntlStockCreate, IntlStockUpdate, IntlStockRead

router = APIRouter(prefix="/api/intl-stocks", tags=["intl-stocks"])


@router.get("", response_model=list[IntlStockRead])
async def list_intl_stocks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IntlStock).order_by(IntlStock.ticker))
    return result.scalars().all()


@router.post("", response_model=IntlStockRead, status_code=201)
async def create_intl_stock(data: IntlStockCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(IntlStock, data.ticker.upper())
    if existing:
        raise HTTPException(409, f"Ticker {data.ticker} already exists")
    obj = IntlStock(**data.model_dump() | {"ticker": data.ticker.upper()})
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{ticker}", response_model=IntlStockRead)
async def get_intl_stock(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(IntlStock, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    return obj


@router.put("/{ticker}", response_model=IntlStockRead)
async def update_intl_stock(ticker: str, data: IntlStockUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(IntlStock, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{ticker}", status_code=204)
async def delete_intl_stock(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(IntlStock, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    await db.delete(obj)
    await db.commit()
