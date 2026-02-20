from sqlalchemy import String, Float, Date, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
import datetime

from .base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    date: Mapped[datetime.date] = mapped_column(Date, index=True)
    operation_type: Mapped[str] = mapped_column(String(20))  # compra|venda|aporte|resgate|transferencia|desdobramento|bonificacao
    asset_class: Mapped[str] = mapped_column(String(20))  # br_stock|fii|intl_stock|fixed_income|real_asset
    ticker: Mapped[str | None] = mapped_column(String(10), nullable=True)
    asset_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    asset_name: Mapped[str] = mapped_column(String(200))
    qty: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    broker: Mapped[str] = mapped_column(String(30), default="")
    broker_destination: Mapped[str | None] = mapped_column(String(30), nullable=True)
    fees: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
