from pydantic import BaseModel
import datetime


class RealAssetBase(BaseModel):
    description: str
    type: str
    estimated_value: float = 0
    acquisition_date: datetime.date
    include_in_total: bool = True
    is_closed: bool = False


class RealAssetCreate(RealAssetBase):
    id: str


class RealAssetUpdate(RealAssetBase):
    pass


class RealAssetRead(RealAssetBase):
    id: str

    model_config = {"from_attributes": True}
