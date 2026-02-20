from sqlalchemy import String, Float, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class AllocationTarget(Base):
    __tablename__ = "allocation_targets"
    __table_args__ = (UniqueConstraint("user_id", "asset_class"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    asset_class: Mapped[str] = mapped_column(String(40))
    target: Mapped[float] = mapped_column(Float, default=0)
    target_type: Mapped[str] = mapped_column(String(10), default="percentage")
    icon: Mapped[str] = mapped_column(String(30), default="")
