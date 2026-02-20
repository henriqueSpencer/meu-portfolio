from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.user import User
from ..models.activity_log import ActivityLog
from ..schemas.activity_log import ActivityLogRead
from ..core.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/metrics")
async def get_metrics(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = await db.scalar(select(func.count()).select_from(User))
    active = await db.scalar(
        select(func.count()).select_from(User).where(User.is_active == True)
    )
    pending = await db.scalar(
        select(func.count())
        .select_from(User)
        .where(
            User.is_approved == False,
            User.email_verified == True,
            User.is_active == True,
        )
    )

    return {
        "total_users": total,
        "active_users": active,
        "pending_users": pending,
    }


@router.get("/logs", response_model=list[ActivityLogRead])
async def get_logs(
    user_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(ActivityLog).order_by(ActivityLog.created_at.desc())

    if user_id:
        query = query.where(ActivityLog.user_id == user_id)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
