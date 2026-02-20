from sqlalchemy import String, Float, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class PatrimonialHistory(Base):
    __tablename__ = "patrimonial_history"
    __table_args__ = (UniqueConstraint("user_id", "month"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    month: Mapped[str] = mapped_column(String(20))
    total: Mapped[float] = mapped_column(Float, default=0)
    cdi: Mapped[float] = mapped_column(Float, default=100)
    ibov: Mapped[float] = mapped_column(Float, default=100)
    ipca6: Mapped[float] = mapped_column(Float, default=100)
    sp500: Mapped[float] = mapped_column(Float, default=100)
