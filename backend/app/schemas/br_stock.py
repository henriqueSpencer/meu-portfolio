from pydantic import BaseModel


class BrStockBase(BaseModel):
    name: str
    sector: str
    qty: int = 0
    avg_price: float = 0
    current_price: float = 0
    lpa: float | None = None
    vpa: float | None = None
    dividends_5y: list[float] | None = None
    fair_price_manual: float | None = None
    broker: str = ""


class BrStockCreate(BrStockBase):
    ticker: str


class BrStockUpdate(BrStockBase):
    pass


class BrStockRead(BrStockBase):
    ticker: str

    model_config = {"from_attributes": True}
