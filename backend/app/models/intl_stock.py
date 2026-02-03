from sqlalchemy import String, Integer, Float
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class IntlStock(Base):
    __tablename__ = "intl_stocks"

    ticker: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    sector: Mapped[str] = mapped_column(String(60))
    type: Mapped[str] = mapped_column(String(20), default="Stock")
    qty: Mapped[int] = mapped_column(Integer, default=0)
    avg_price_usd: Mapped[float] = mapped_column(Float, default=0)
    current_price_usd: Mapped[float] = mapped_column(Float, default=0)
    lpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    vpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    dividends_5y: Mapped[list[float] | None] = mapped_column(ARRAY(Float), nullable=True)
    fair_price_manual: Mapped[float | None] = mapped_column(Float, nullable=True)
    broker: Mapped[str] = mapped_column(String(30), default="")
