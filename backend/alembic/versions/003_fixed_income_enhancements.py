"""Add indexer, contracted_rate, tax_exempt to fixed_income

Revision ID: 003
Revises: 002
Create Date: 2026-02-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("fixed_income", sa.Column("indexer", sa.String(20), server_default="CDI", nullable=False))
    op.add_column("fixed_income", sa.Column("contracted_rate", sa.Float, server_default="0", nullable=False))
    op.add_column("fixed_income", sa.Column("tax_exempt", sa.Boolean, server_default="false", nullable=False))

    # Back-fill existing seed rows with correct values
    op.execute("UPDATE fixed_income SET indexer = 'IPCA', contracted_rate = 6.20 WHERE id = 'rf1'")
    op.execute("UPDATE fixed_income SET indexer = 'CDI', contracted_rate = 120 WHERE id = 'rf2'")
    op.execute("UPDATE fixed_income SET indexer = 'CDI', contracted_rate = 95, tax_exempt = true WHERE id = 'rf3'")


def downgrade() -> None:
    op.drop_column("fixed_income", "tax_exempt")
    op.drop_column("fixed_income", "contracted_rate")
    op.drop_column("fixed_income", "indexer")
