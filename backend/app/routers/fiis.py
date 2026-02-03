from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.fii import Fii
from ..schemas.fii import FiiCreate, FiiUpdate, FiiRead

router = APIRouter(prefix="/api/fiis", tags=["fiis"])


@router.get("", response_model=list[FiiRead])
async def list_fiis(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Fii).order_by(Fii.ticker))
    return result.scalars().all()


@router.post("", response_model=FiiRead, status_code=201)
async def create_fii(data: FiiCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(Fii, data.ticker.upper())
    if existing:
        raise HTTPException(409, f"Ticker {data.ticker} already exists")
    obj = Fii(**data.model_dump() | {"ticker": data.ticker.upper()})
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{ticker}", response_model=FiiRead)
async def get_fii(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Fii, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    return obj


@router.put("/{ticker}", response_model=FiiRead)
async def update_fii(ticker: str, data: FiiUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Fii, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{ticker}", status_code=204)
async def delete_fii(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Fii, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    await db.delete(obj)
    await db.commit()
