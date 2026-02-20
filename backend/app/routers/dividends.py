from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database import get_db
from ..models.dividend import Dividend
from ..models.user import User
from ..schemas.dividend import DividendCreate, DividendUpdate, DividendRead

router = APIRouter(prefix="/api/dividends", tags=["dividends"])


@router.get("", response_model=list[DividendRead])
async def list_dividends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dividend)
        .where(Dividend.user_id == user.id)
        .order_by(Dividend.date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=DividendRead, status_code=201)
async def create_dividend(
    data: DividendCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = Dividend(**data.model_dump(), user_id=user.id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{dividend_id}", response_model=DividendRead)
async def get_dividend(
    dividend_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Dividend, dividend_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, f"Dividend {dividend_id} not found")
    return obj


@router.put("/{dividend_id}", response_model=DividendRead)
async def update_dividend(
    dividend_id: int,
    data: DividendUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Dividend, dividend_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, f"Dividend {dividend_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{dividend_id}", status_code=204)
async def delete_dividend(
    dividend_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Dividend, dividend_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, f"Dividend {dividend_id} not found")
    await db.delete(obj)
    await db.commit()
