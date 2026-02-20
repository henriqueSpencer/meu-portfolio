"""Add users, activity_logs tables and user_id to all models

Revision ID: 006
Revises: 005
Create Date: 2026-02-20

NOTE: This migration restructures all tables for multi-tenancy.
      Run on a clean database: docker compose down -v && docker compose up --build
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- 1. Create users table ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("role", sa.String(10), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("email_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_approved", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("google_id", sa.String(255), unique=True, nullable=True),
        sa.Column("verification_token", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- 2. Create activity_logs table ---
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("resource", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(100), nullable=True),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- 3. Add user_id to ticker-based tables (composite PK) ---
    # These tables need to be recreated since we're changing the PK structure.
    # For a clean DB this is fine. For existing data, you'd need a data migration.

    # Drop old tables and recreate with composite PK
    for table_name in ["br_stocks", "fiis", "intl_stocks", "fi_etfs", "watchlist"]:
        # We drop and recreate. On clean DB, these are empty.
        op.drop_table(table_name)

    # Recreate br_stocks
    op.create_table(
        "br_stocks",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price", sa.Float, server_default="0"),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("lpa", sa.Float, nullable=True),
        sa.Column("vpa", sa.Float, nullable=True),
        sa.Column("dividends_5y", sa.ARRAY(sa.Float), nullable=True),
        sa.Column("fair_price_manual", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), server_default=""),
    )

    # Recreate fiis
    op.create_table(
        "fiis",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price", sa.Float, server_default="0"),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("pvp", sa.Float, server_default="0"),
        sa.Column("dy_12m", sa.Float, server_default="0"),
        sa.Column("last_dividend", sa.Float, server_default="0"),
        sa.Column("broker", sa.String(30), server_default=""),
    )

    # Recreate intl_stocks
    op.create_table(
        "intl_stocks",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("type", sa.String(20), server_default="Stock"),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price_usd", sa.Float, server_default="0"),
        sa.Column("current_price_usd", sa.Float, server_default="0"),
        sa.Column("lpa", sa.Float, nullable=True),
        sa.Column("vpa", sa.Float, nullable=True),
        sa.Column("dividends_5y", sa.ARRAY(sa.Float), nullable=True),
        sa.Column("fair_price_manual", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), server_default=""),
    )

    # Recreate fi_etfs
    op.create_table(
        "fi_etfs",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price", sa.Float, server_default="0"),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("broker", sa.String(30), server_default=""),
    )

    # Recreate watchlist
    op.create_table(
        "watchlist",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("fair_price", sa.Float, server_default="0"),
        sa.Column("target_price", sa.Float, server_default="0"),
        sa.Column("status", sa.String(20), server_default="Interesse"),
        sa.Column("sector", sa.String(60), server_default=""),
    )

    # --- 4. Add user_id to id-based tables ---
    for table_name in [
        "fixed_income", "real_assets", "cash_accounts",
        "dividends", "transactions", "accumulation_goals",
    ]:
        op.add_column(table_name, sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, server_default=""))
        op.create_index(f"ix_{table_name}_user_id", table_name, ["user_id"])

    # allocation_targets: add user_id + unique constraint (user_id, asset_class)
    op.add_column("allocation_targets", sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, server_default=""))
    op.create_index("ix_allocation_targets_user_id", "allocation_targets", ["user_id"])
    # Drop old unique constraint on asset_class (if exists)
    try:
        op.drop_constraint("allocation_targets_asset_class_key", "allocation_targets", type_="unique")
    except Exception:
        pass
    op.create_unique_constraint("uq_allocation_targets_user_asset", "allocation_targets", ["user_id", "asset_class"])

    # patrimonial_history: add user_id + unique constraint (user_id, month)
    op.add_column("patrimonial_history", sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, server_default=""))
    op.create_index("ix_patrimonial_history_user_id", "patrimonial_history", ["user_id"])
    # Drop old unique constraint on month (if exists)
    try:
        op.drop_constraint("patrimonial_history_month_key", "patrimonial_history", type_="unique")
    except Exception:
        pass
    op.create_unique_constraint("uq_patrimonial_history_user_month", "patrimonial_history", ["user_id", "month"])


def downgrade() -> None:
    # Remove user_id from id-based tables
    for table_name in [
        "fixed_income", "real_assets", "cash_accounts",
        "dividends", "transactions", "accumulation_goals",
    ]:
        op.drop_index(f"ix_{table_name}_user_id", table_name)
        op.drop_column(table_name, "user_id")

    op.drop_constraint("uq_allocation_targets_user_asset", "allocation_targets", type_="unique")
    op.drop_index("ix_allocation_targets_user_id", "allocation_targets")
    op.drop_column("allocation_targets", "user_id")
    op.create_unique_constraint("allocation_targets_asset_class_key", "allocation_targets", ["asset_class"])

    op.drop_constraint("uq_patrimonial_history_user_month", "patrimonial_history", type_="unique")
    op.drop_index("ix_patrimonial_history_user_id", "patrimonial_history")
    op.drop_column("patrimonial_history", "user_id")
    op.create_unique_constraint("patrimonial_history_month_key", "patrimonial_history", ["month"])

    # Drop and recreate ticker-based tables without user_id
    for table_name in ["watchlist", "fi_etfs", "intl_stocks", "fiis", "br_stocks"]:
        op.drop_table(table_name)

    # Recreate original ticker-only PK tables (simplified)
    op.create_table("br_stocks",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price", sa.Float, server_default="0"),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("lpa", sa.Float, nullable=True),
        sa.Column("vpa", sa.Float, nullable=True),
        sa.Column("dividends_5y", sa.ARRAY(sa.Float), nullable=True),
        sa.Column("fair_price_manual", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), server_default=""),
    )
    op.create_table("fiis",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price", sa.Float, server_default="0"),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("pvp", sa.Float, server_default="0"),
        sa.Column("dy_12m", sa.Float, server_default="0"),
        sa.Column("last_dividend", sa.Float, server_default="0"),
        sa.Column("broker", sa.String(30), server_default=""),
    )
    op.create_table("intl_stocks",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("type", sa.String(20), server_default="Stock"),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price_usd", sa.Float, server_default="0"),
        sa.Column("current_price_usd", sa.Float, server_default="0"),
        sa.Column("lpa", sa.Float, nullable=True),
        sa.Column("vpa", sa.Float, nullable=True),
        sa.Column("dividends_5y", sa.ARRAY(sa.Float), nullable=True),
        sa.Column("fair_price_manual", sa.Float, nullable=True),
        sa.Column("broker", sa.String(30), server_default=""),
    )
    op.create_table("fi_etfs",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("qty", sa.Integer, server_default="0"),
        sa.Column("avg_price", sa.Float, server_default="0"),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("broker", sa.String(30), server_default=""),
    )
    op.create_table("watchlist",
        sa.Column("ticker", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("current_price", sa.Float, server_default="0"),
        sa.Column("fair_price", sa.Float, server_default="0"),
        sa.Column("target_price", sa.Float, server_default="0"),
        sa.Column("status", sa.String(20), server_default="Interesse"),
        sa.Column("sector", sa.String(60), server_default=""),
    )

    # Drop new tables
    op.drop_table("activity_logs")
    op.drop_table("users")
