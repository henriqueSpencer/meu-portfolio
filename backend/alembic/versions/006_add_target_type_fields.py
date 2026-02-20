"""Add target_type to allocation_targets and accumulation_goals

Revision ID: 006
Revises: 005
Create Date: 2026-02-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("allocation_targets", sa.Column("target_type", sa.String(10), server_default="percentage", nullable=False))
    op.add_column("accumulation_goals", sa.Column("target_type", sa.String(10), server_default="qty", nullable=False))
    op.add_column("accumulation_goals", sa.Column("target_value", sa.Float, server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("accumulation_goals", "target_value")
    op.drop_column("accumulation_goals", "target_type")
    op.drop_column("allocation_targets", "target_type")
