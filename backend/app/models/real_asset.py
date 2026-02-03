from sqlalchemy import String, Float, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column
import datetime

from .base import Base


class RealAsset(Base):
    __tablename__ = "real_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    description: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(30))
    estimated_value: Mapped[float] = mapped_column(Float, default=0)
    acquisition_date: Mapped[datetime.date] = mapped_column(Date)
    include_in_total: Mapped[bool] = mapped_column(Boolean, default=True)
