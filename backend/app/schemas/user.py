from datetime import datetime

from pydantic import BaseModel


class UserRead(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    email_verified: bool
    is_approved: bool
    google_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    is_approved: bool | None = None
    role: str | None = None
