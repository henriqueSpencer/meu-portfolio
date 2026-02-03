from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class AllocationTarget(Base):
    __tablename__ = "allocation_targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_class: Mapped[str] = mapped_column(String(40), unique=True)
    target: Mapped[float] = mapped_column(Float, default=0)
    icon: Mapped[str] = mapped_column(String(30), default="")
