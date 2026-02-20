from pydantic import BaseModel


class AllocationTargetBase(BaseModel):
    asset_class: str
    target: float = 0
    target_type: str = "percentage"
    icon: str = ""


class AllocationTargetCreate(AllocationTargetBase):
    pass


class AllocationTargetUpdate(AllocationTargetBase):
    pass


class AllocationTargetRead(AllocationTargetBase):
    id: int

    model_config = {"from_attributes": True}
