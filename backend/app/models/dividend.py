from sqlalchemy import String, Float, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column
import datetime

from .base import Base


class Dividend(Base):
    __tablename__ = "dividends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[datetime.date] = mapped_column(Date, index=True)
    ticker: Mapped[str] = mapped_column(String(10), index=True)
    type: Mapped[str] = mapped_column(String(20))
    value: Mapped[float] = mapped_column(Float, default=0)
