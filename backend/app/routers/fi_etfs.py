from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database import get_db
from ..models.fi_etf import FiEtf
from ..models.user import User
from ..schemas.fi_etf import FiEtfCreate, FiEtfUpdate, FiEtfRead

router = APIRouter(prefix="/api/fi-etfs", tags=["fi-etfs"])


@router.get("", response_model=list[FiEtfRead])
async def list_fi_etfs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FiEtf).where(FiEtf.user_id == user.id).order_by(FiEtf.ticker)
    )
    return result.scalars().all()


@router.post("", response_model=FiEtfRead, status_code=201)
async def create_fi_etf(
    data: FiEtfCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data.ticker = data.ticker.upper()
    existing = await db.get(FiEtf, (user.id, data.ticker))
    if existing:
        raise HTTPException(409, f"Ticker {data.ticker} already exists")
    obj = FiEtf(**data.model_dump(), user_id=user.id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{ticker}", response_model=FiEtfRead)
async def get_fi_etf(
    ticker: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(FiEtf, (user.id, ticker.upper()))
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    return obj


@router.put("/{ticker}", response_model=FiEtfRead)
async def update_fi_etf(
    ticker: str,
    data: FiEtfUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(FiEtf, (user.id, ticker.upper()))
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{ticker}", status_code=204)
async def delete_fi_etf(
    ticker: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(FiEtf, (user.id, ticker.upper()))
    if not obj:
        raise HTTPException(404, f"Ticker {ticker} not found")
    await db.delete(obj)
    await db.commit()
