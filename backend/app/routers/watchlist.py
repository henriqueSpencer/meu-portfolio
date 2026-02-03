from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.watchlist import WatchlistItem
from ..schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistRead

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistRead])
async def list_watchlist(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WatchlistItem).order_by(WatchlistItem.ticker))
    return result.scalars().all()


@router.post("", response_model=WatchlistRead, status_code=201)
async def create_watchlist_item(data: WatchlistCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(WatchlistItem, data.ticker.upper())
    if existing:
        raise HTTPException(409, f"Ticker {data.ticker} already exists")
    obj = WatchlistItem(**data.model_dump() | {"ticker": data.ticker.upper()})
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{ticker}", response_model=WatchlistRead)
async def get_watchlist_item(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(WatchlistItem, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    return obj


@router.put("/{ticker}", response_model=WatchlistRead)
async def update_watchlist_item(ticker: str, data: WatchlistUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(WatchlistItem, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{ticker}", status_code=204)
async def delete_watchlist_item(ticker: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(WatchlistItem, ticker.upper())
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    await db.delete(obj)
    await db.commit()
