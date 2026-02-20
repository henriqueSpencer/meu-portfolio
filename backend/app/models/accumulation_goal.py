from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class AccumulationGoal(Base):
    __tablename__ = "accumulation_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ticker: Mapped[str] = mapped_column(String(10))
    target_qty: Mapped[int] = mapped_column(Integer, default=0)
    target_type: Mapped[str] = mapped_column(String(10), default="qty")
    target_value: Mapped[float] = mapped_column(Float, default=0)
    note: Mapped[str] = mapped_column(String(200), default="")
