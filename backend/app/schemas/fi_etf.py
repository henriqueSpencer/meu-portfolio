from pydantic import BaseModel


class FiEtfBase(BaseModel):
    name: str
    qty: int = 0
    avg_price: float = 0
    current_price: float = 0
    broker: str = ""


class FiEtfCreate(FiEtfBase):
    ticker: str


class FiEtfUpdate(FiEtfBase):
    pass


class FiEtfRead(FiEtfBase):
    ticker: str

    model_config = {"from_attributes": True}
