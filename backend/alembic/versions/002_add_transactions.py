"""Add transactions table

Revision ID: 002
Revises: 001
Create Date: 2026-02-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("date", sa.Date, nullable=False, index=True),
        sa.Column("operation_type", sa.String(20), nullable=False),
        sa.Column("asset_class", sa.String(20), nullable=False),
        sa.Column("ticker", sa.String(10), nullable=True),
        sa.Column("asset_id", sa.String(36), nullable=True),
        sa.Column("asset_name", sa.String(200), nullable=False),
        sa.Column("qty", sa.Float, nullable=True),
        sa.Column("unit_price", sa.Float, nullable=True),
        sa.Column("total_value", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), default="", nullable=False),
        sa.Column("broker_destination", sa.String(30), nullable=True),
        sa.Column("fees", sa.Float, default=0, nullable=False),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("transactions")
