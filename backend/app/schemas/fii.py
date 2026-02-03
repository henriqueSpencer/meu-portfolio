from pydantic import BaseModel


class FiiBase(BaseModel):
    name: str
    sector: str
    qty: int = 0
    avg_price: float = 0
    current_price: float = 0
    pvp: float = 0
    dy_12m: float = 0
    last_dividend: float = 0
    broker: str = ""


class FiiCreate(FiiBase):
    ticker: str


class FiiUpdate(FiiBase):
    pass


class FiiRead(FiiBase):
    ticker: str

    model_config = {"from_attributes": True}
