from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.br_stock import BrStock
from ..schemas.br_stock import BrStockCreate, BrStockUpdate, BrStockRead

router = APIRouter(prefix="/api/br-stocks", tags=["br-stocks"])


@router.get("", response_model=list[BrStockRead])
async def list_br_stocks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BrStock).order_by(BrStock.ticker))
    return result.scalars().all()


@router.post("", response_model=BrStockRead, status_code=201)
async def create_br_stock(data: BrStockCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(BrStock, data.ticker.upper())
    if existing:
        raise HTTPException(409, f"Ticker {data.ticker} already exists")
    obj = BrStock(**data.model_dump() | {"ticker": data.ticker.upper()})
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{ticker}", response_model=BrStockRead)
async def get_br_stock(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(BrStock, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    return obj


@router.put("/{ticker}", response_model=BrStockRead)
async def update_br_stock(ticker: str, data: BrStockUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(BrStock, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{ticker}", status_code=204)
async def delete_br_stock(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(BrStock, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    await db.delete(obj)
    await db.commit()
