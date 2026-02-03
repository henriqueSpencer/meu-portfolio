from pydantic import BaseModel


class AccumulationGoalBase(BaseModel):
    ticker: str
    target_qty: int = 0
    note: str = ""


class AccumulationGoalCreate(AccumulationGoalBase):
    id: str


class AccumulationGoalUpdate(AccumulationGoalBase):
    pass


class AccumulationGoalRead(AccumulationGoalBase):
    id: str

    model_config = {"from_attributes": True}
