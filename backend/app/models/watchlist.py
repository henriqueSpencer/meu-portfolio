from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class WatchlistItem(Base):
    __tablename__ = "watchlist"

    ticker: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    current_price: Mapped[float] = mapped_column(Float, default=0)
    fair_price: Mapped[float] = mapped_column(Float, default=0)
    target_price: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(20), default="Interesse")
    sector: Mapped[str] = mapped_column(String(60), default="")
