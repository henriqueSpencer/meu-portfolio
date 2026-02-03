"""Add fi_etfs and cash_accounts tables

Revision ID: 004
Revises: 003
Create Date: 2026-02-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "fi_etfs",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0", nullable=False),
        sa.Column("avg_price", sa.Float, server_default="0", nullable=False),
        sa.Column("current_price", sa.Float, server_default="0", nullable=False),
        sa.Column("broker", sa.String(30), server_default="", nullable=False),
    )

    op.create_table(
        "cash_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("institution", sa.String(60), server_default="", nullable=False),
        sa.Column("balance", sa.Float, server_default="0", nullable=False),
        sa.Column("currency", sa.String(3), server_default="BRL", nullable=False),
    )

    # Rename seed allocation target from "Reserva Emergencia" to "Caixa"
    op.execute("UPDATE allocation_targets SET asset_class = 'Caixa' WHERE asset_class = 'Reserva Emergencia'")


def downgrade() -> None:
    op.execute("UPDATE allocation_targets SET asset_class = 'Reserva Emergencia' WHERE asset_class = 'Caixa'")
    op.drop_table("cash_accounts")
    op.drop_table("fi_etfs")
