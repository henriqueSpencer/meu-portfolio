from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserRead, UserUpdate
from ..core.security import require_admin
from ..core.activity_logger import log_activity

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/pending", response_model=list[UserRead])
async def list_pending_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.is_approved == False, User.email_verified == True, User.is_active == True)
        .order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    data: UserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await log_activity(
        db, admin.id, "update_user", "users",
        resource_id=user_id,
        details=str(update_data),
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/approve", response_model=UserRead)
async def approve_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")

    user.is_approved = True
    await log_activity(
        db, admin.id, "approve_user", "users",
        resource_id=user_id,
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")
    if user.role == "admin":
        raise HTTPException(400, "Nao e possivel deletar um administrador")

    await log_activity(
        db, admin.id, "delete_user", "users",
        resource_id=user_id,
        details=f"email={user.email}",
    )
    await db.delete(user)
    await db.commit()
