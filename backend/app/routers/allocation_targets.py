from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database import get_db
from ..models.allocation_target import AllocationTarget
from ..models.user import User
from ..schemas.allocation_target import AllocationTargetCreate, AllocationTargetUpdate, AllocationTargetRead

router = APIRouter(prefix="/api/allocation-targets", tags=["allocation-targets"])


@router.get("", response_model=list[AllocationTargetRead])
async def list_targets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AllocationTarget)
        .where(AllocationTarget.user_id == user.id)
        .order_by(AllocationTarget.id)
    )
    return result.scalars().all()


@router.post("", response_model=AllocationTargetRead, status_code=201)
async def create_target(
    data: AllocationTargetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = AllocationTarget(**data.model_dump(), user_id=user.id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.put("/{target_id}", response_model=AllocationTargetRead)
async def update_target(
    target_id: int,
    data: AllocationTargetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(AllocationTarget, target_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, f"Target {target_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{target_id}", status_code=204)
async def delete_target(
    target_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(AllocationTarget, target_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, f"Target {target_id} not found")
    await db.delete(obj)
    await db.commit()
