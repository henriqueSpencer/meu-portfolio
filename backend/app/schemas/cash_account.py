from pydantic import BaseModel
from typing import Literal


class CashAccountBase(BaseModel):
    name: str
    type: Literal["conta_corrente", "poupanca", "especie", "cartao_credito"]
    institution: str = ""
    balance: float = 0
    currency: str = "BRL"


class CashAccountCreate(CashAccountBase):
    id: str


class CashAccountUpdate(CashAccountBase):
    pass


class CashAccountRead(CashAccountBase):
    id: str

    model_config = {"from_attributes": True}
