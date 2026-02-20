from datetime import datetime

from pydantic import BaseModel


class ActivityLogRead(BaseModel):
    id: int
    user_id: str
    action: str
    resource: str
    resource_id: str | None = None
    details: str | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
