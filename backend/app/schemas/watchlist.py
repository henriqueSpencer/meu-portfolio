from pydantic import BaseModel


class WatchlistBase(BaseModel):
    name: str
    current_price: float = 0
    fair_price: float = 0
    target_price: float = 0
    status: str = "Interesse"
    sector: str = ""


class WatchlistCreate(WatchlistBase):
    ticker: str


class WatchlistUpdate(WatchlistBase):
    pass


class WatchlistRead(WatchlistBase):
    ticker: str

    model_config = {"from_attributes": True}
