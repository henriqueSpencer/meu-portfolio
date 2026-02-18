from sqlalchemy import String, Float, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column
import datetime

from .base import Base


class FixedIncome(Base):
    __tablename__ = "fixed_income"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(30))
    rate: Mapped[str] = mapped_column(String(40))
    applied_value: Mapped[float] = mapped_column(Float, default=0)
    current_value: Mapped[float] = mapped_column(Float, default=0)
    application_date: Mapped[datetime.date] = mapped_column(Date)
    maturity_date: Mapped[datetime.date] = mapped_column(Date)
    broker: Mapped[str] = mapped_column(String(30), default="")
    indexer: Mapped[str] = mapped_column(String(20), default="CDI")
    contracted_rate: Mapped[float] = mapped_column(Float, default=0)
    tax_exempt: Mapped[bool] = mapped_column(Boolean, default=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
