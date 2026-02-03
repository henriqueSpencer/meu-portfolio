from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class PatrimonialHistory(Base):
    __tablename__ = "patrimonial_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    month: Mapped[str] = mapped_column(String(20), unique=True)
    total: Mapped[float] = mapped_column(Float, default=0)
    cdi: Mapped[float] = mapped_column(Float, default=100)
    ibov: Mapped[float] = mapped_column(Float, default=100)
    ipca6: Mapped[float] = mapped_column(Float, default=100)
    sp500: Mapped[float] = mapped_column(Float, default=100)
