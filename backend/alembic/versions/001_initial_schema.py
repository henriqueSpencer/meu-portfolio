"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "br_stocks",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("qty", sa.Integer, default=0, nullable=False),
        sa.Column("avg_price", sa.Float, default=0, nullable=False),
        sa.Column("current_price", sa.Float, default=0, nullable=False),
        sa.Column("lpa", sa.Float, nullable=True),
        sa.Column("vpa", sa.Float, nullable=True),
        sa.Column("dividends_5y", postgresql.ARRAY(sa.Float), nullable=True),
        sa.Column("fair_price_manual", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), default="", nullable=False),
    )

    op.create_table(
        "fiis",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("qty", sa.Integer, default=0, nullable=False),
        sa.Column("avg_price", sa.Float, default=0, nullable=False),
        sa.Column("current_price", sa.Float, default=0, nullable=False),
        sa.Column("pvp", sa.Float, default=0, nullable=False),
        sa.Column("dy_12m", sa.Float, default=0, nullable=False),
        sa.Column("last_dividend", sa.Float, default=0, nullable=False),
        sa.Column("broker", sa.String(30), default="", nullable=False),
    )

    op.create_table(
        "intl_stocks",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("type", sa.String(20), default="Stock", nullable=False),
        sa.Column("qty", sa.Integer, default=0, nullable=False),
        sa.Column("avg_price_usd", sa.Float, default=0, nullable=False),
        sa.Column("current_price_usd", sa.Float, default=0, nullable=False),
        sa.Column("lpa", sa.Float, nullable=True),
        sa.Column("vpa", sa.Float, nullable=True),
        sa.Column("dividends_5y", postgresql.ARRAY(sa.Float), nullable=True),
        sa.Column("fair_price_manual", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), default="", nullable=False),
    )

    op.create_table(
        "fixed_income",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("rate", sa.String(40), nullable=False),
        sa.Column("applied_value", sa.Float, default=0, nullable=False),
        sa.Column("current_value", sa.Float, default=0, nullable=False),
        sa.Column("application_date", sa.Date, nullable=False),
        sa.Column("maturity_date", sa.Date, nullable=False),
        sa.Column("broker", sa.String(30), default="", nullable=False),
    )

    op.create_table(
        "real_assets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("description", sa.String(200), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("estimated_value", sa.Float, default=0, nullable=False),
        sa.Column("acquisition_date", sa.Date, nullable=False),
        sa.Column("include_in_total", sa.Boolean, default=True, nullable=False),
    )

    op.create_table(
        "dividends",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("date", sa.Date, nullable=False, index=True),
        sa.Column("ticker", sa.String(10), nullable=False, index=True),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("value", sa.Float, default=0, nullable=False),
    )

    op.create_table(
        "watchlist",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("current_price", sa.Float, default=0, nullable=False),
        sa.Column("fair_price", sa.Float, default=0, nullable=False),
        sa.Column("target_price", sa.Float, default=0, nullable=False),
        sa.Column("status", sa.String(20), default="Interesse", nullable=False),
        sa.Column("sector", sa.String(60), default="", nullable=False),
    )

    op.create_table(
        "allocation_targets",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("asset_class", sa.String(40), unique=True, nullable=False),
        sa.Column("target", sa.Float, default=0, nullable=False),
        sa.Column("icon", sa.String(30), default="", nullable=False),
    )

    op.create_table(
        "accumulation_goals",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ticker", sa.String(10), nullable=False),
        sa.Column("target_qty", sa.Integer, default=0, nullable=False),
        sa.Column("note", sa.String(200), default="", nullable=False),
    )

    op.create_table(
        "patrimonial_history",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("month", sa.String(20), unique=True, nullable=False),
        sa.Column("total", sa.Float, default=0, nullable=False),
        sa.Column("cdi", sa.Float, default=100, nullable=False),
        sa.Column("ibov", sa.Float, default=100, nullable=False),
        sa.Column("ipca6", sa.Float, default=100, nullable=False),
        sa.Column("sp500", sa.Float, default=100, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("patrimonial_history")
    op.drop_table("accumulation_goals")
    op.drop_table("allocation_targets")
    op.drop_table("watchlist")
    op.drop_table("dividends")
    op.drop_table("real_assets")
    op.drop_table("fixed_income")
    op.drop_table("intl_stocks")
    op.drop_table("fiis")
    op.drop_table("br_stocks")
