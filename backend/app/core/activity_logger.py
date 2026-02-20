from sqlalchemy.ext.asyncio import AsyncSession

from ..models.activity_log import ActivityLog


async def log_activity(
    db: AsyncSession,
    user_id: str,
    action: str,
    resource: str,
    resource_id: str | None = None,
    details: str | None = None,
    ip_address: str | None = None,
):
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
