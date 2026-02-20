from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database import get_db
from ..models.patrimonial_history import PatrimonialHistory
from ..models.user import User
from ..schemas.patrimonial_history import PatrimonialHistoryRead

router = APIRouter(prefix="/api/patrimonial-history", tags=["patrimonial-history"])


@router.get("", response_model=list[PatrimonialHistoryRead])
async def list_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PatrimonialHistory)
        .where(PatrimonialHistory.user_id == user.id)
        .order_by(PatrimonialHistory.id)
    )
    return result.scalars().all()
