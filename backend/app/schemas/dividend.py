from pydantic import BaseModel
import datetime


class DividendBase(BaseModel):
    date: datetime.date
    ticker: str
    type: str
    value: float = 0


class DividendCreate(DividendBase):
    pass


class DividendUpdate(DividendBase):
    pass


class DividendRead(DividendBase):
    id: int

    model_config = {"from_attributes": True}
