from pydantic import BaseModel
import datetime


class FixedIncomeBase(BaseModel):
    title: str
    type: str
    rate: str
    applied_value: float = 0
    current_value: float = 0
    application_date: datetime.date
    maturity_date: datetime.date
    broker: str = ""


class FixedIncomeCreate(FixedIncomeBase):
    id: str


class FixedIncomeUpdate(FixedIncomeBase):
    pass


class FixedIncomeRead(FixedIncomeBase):
    id: str

    model_config = {"from_attributes": True}
