from pydantic import BaseModel


class IntlStockBase(BaseModel):
    name: str
    sector: str
    type: str = "Stock"
    qty: int = 0
    avg_price_usd: float = 0
    current_price_usd: float = 0
    lpa: float | None = None
    vpa: float | None = None
    dividends_5y: list[float] | None = None
    fair_price_manual: float | None = None
    broker: str = ""


class IntlStockCreate(IntlStockBase):
    ticker: str


class IntlStockUpdate(IntlStockBase):
    pass


class IntlStockRead(IntlStockBase):
    ticker: str

    model_config = {"from_attributes": True}
