from pydantic import BaseModel
import datetime


class TransactionCreate(BaseModel):
    date: datetime.date
    operation_type: str
    asset_class: str
    ticker: str | None = None
    asset_id: str | None = None
    asset_name: str
    qty: float | None = None
    unit_price: float | None = None
    total_value: float | None = None
    broker: str = ""
    broker_destination: str | None = None
    fees: float = 0
    notes: str | None = None


class TransactionUpdate(BaseModel):
    date: datetime.date | None = None
    operation_type: str | None = None
    asset_class: str | None = None
    ticker: str | None = None
    asset_id: str | None = None
    asset_name: str | None = None
    qty: float | None = None
    unit_price: float | None = None
    total_value: float | None = None
    broker: str | None = None
    broker_destination: str | None = None
    fees: float | None = None
    notes: str | None = None


class TransactionRead(BaseModel):
    id: int
    date: datetime.date
    operation_type: str
    asset_class: str
    ticker: str | None = None
    asset_id: str | None = None
    asset_name: str
    qty: float | None = None
    unit_price: float | None = None
    total_value: float | None = None
    broker: str = ""
    broker_destination: str | None = None
    fees: float = 0
    notes: str | None = None
    created_at: datetime.datetime | None = None

    model_config = {"from_attributes": True}
