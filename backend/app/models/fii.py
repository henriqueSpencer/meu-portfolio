from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Fii(Base):
    __tablename__ = "fiis"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    ticker: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    sector: Mapped[str] = mapped_column(String(60))
    qty: Mapped[int] = mapped_column(Integer, default=0)
    avg_price: Mapped[float] = mapped_column(Float, default=0)
    current_price: Mapped[float] = mapped_column(Float, default=0)
    pvp: Mapped[float] = mapped_column(Float, default=0)
    dy_12m: Mapped[float] = mapped_column(Float, default=0)
    last_dividend: Mapped[float] = mapped_column(Float, default=0)
    broker: Mapped[str] = mapped_column(String(30), default="")
