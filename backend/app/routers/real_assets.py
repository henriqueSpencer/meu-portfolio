from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.real_asset import RealAsset
from ..schemas.real_asset import RealAssetCreate, RealAssetUpdate, RealAssetRead

router = APIRouter(prefix="/api/real-assets", tags=["real-assets"])


@router.get("", response_model=list[RealAssetRead])
async def list_real_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RealAsset).order_by(RealAsset.acquisition_date))
    return result.scalars().all()


@router.post("", response_model=RealAssetRead, status_code=201)
async def create_real_asset(data: RealAssetCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(RealAsset, data.id)
    if existing:
        raise HTTPException(409, f"ID {data.id} already exists")
    obj = RealAsset(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=RealAssetRead)
async def get_real_asset(item_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(RealAsset, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    return obj


@router.put("/{item_id}", response_model=RealAssetRead)
async def update_real_asset(item_id: str, data: RealAssetUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(RealAsset, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_real_asset(item_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(RealAsset, item_id)
    if not obj:
        raise HTTPException(404, f"ID {item_id} not found")
    await db.delete(obj)
    await db.commit()
