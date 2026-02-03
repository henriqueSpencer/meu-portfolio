from pydantic import BaseModel


class PatrimonialHistoryBase(BaseModel):
    month: str
    total: float = 0
    cdi: float = 100
    ibov: float = 100
    ipca6: float = 100
    sp500: float = 100


class PatrimonialHistoryCreate(PatrimonialHistoryBase):
    pass


class PatrimonialHistoryRead(PatrimonialHistoryBase):
    id: int

    model_config = {"from_attributes": True}
