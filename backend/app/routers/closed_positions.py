"""Aggregated metrics for closed positions, computed from transactions + dividends."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.transaction import Transaction
from ..models.dividend import Dividend

router = APIRouter(prefix="/api/closed-position-metrics", tags=["closed-positions"])

# Asset classes that use ticker as identifier
TICKER_CLASSES = {"br_stock", "fii", "intl_stock", "fi_etf"}
# Asset classes that use asset_id as identifier
ID_CLASSES = {"fixed_income", "real_asset", "cash_account"}

# Operations that count as "buying" / "selling" per class
BUY_OPS = {
    "br_stock": {"compra", "bonificacao"},
    "fii": {"compra", "bonificacao"},
    "intl_stock": {"compra", "bonificacao"},
    "fi_etf": {"compra", "bonificacao"},
    "fixed_income": {"aporte"},
    "real_asset": {"compra"},
    "cash_account": {"aporte"},
}

SELL_OPS = {
    "br_stock": {"venda"},
    "fii": {"venda"},
    "intl_stock": {"venda"},
    "fi_etf": {"venda"},
    "fixed_income": {"resgate"},
    "real_asset": {"venda"},
    "cash_account": {"resgate"},
}


@router.get("")
async def get_closed_position_metrics(
    asset_class: str = Query(..., description="Asset class: br_stock, fii, intl_stock, fi_etf, fixed_income, real_asset, cash_account"),
    db: AsyncSession = Depends(get_db),
):
    # Fetch all transactions for this asset class
    result = await db.execute(
        select(Transaction)
        .where(Transaction.asset_class == asset_class)
        .order_by(Transaction.date)
    )
    transactions = result.scalars().all()

    use_ticker = asset_class in TICKER_CLASSES
    buy_ops = BUY_OPS.get(asset_class, set())
    sell_ops = SELL_OPS.get(asset_class, set())

    # Group transactions by asset key (ticker or asset_id)
    groups: dict[str, list] = {}
    for tx in transactions:
        key = tx.ticker if use_ticker else tx.asset_id
        if not key:
            continue
        groups.setdefault(key, []).append(tx)

    # Fetch dividends if ticker-based
    dividends_by_ticker: dict[str, float] = {}
    if use_ticker:
        div_result = await db.execute(
            select(Dividend.ticker, func.sum(Dividend.value).label("total"))
            .group_by(Dividend.ticker)
        )
        for row in div_result:
            dividends_by_ticker[row.ticker] = row.total or 0

    # Build metrics per asset
    metrics = {}
    for key, txs in groups.items():
        total_cost = 0.0
        total_proceeds = 0.0
        total_bought_qty = 0.0
        total_sold_qty = 0.0
        total_fees = 0.0
        first_buy_date = None
        last_sell_date = None

        for tx in txs:
            op = tx.operation_type
            if op in buy_ops:
                if use_ticker:
                    qty = tx.qty or 0
                    price = tx.unit_price or 0
                    total_cost += qty * price
                    total_bought_qty += qty
                else:
                    total_cost += tx.total_value or 0
                    total_bought_qty += tx.total_value or 0
                if not first_buy_date:
                    first_buy_date = str(tx.date)
            elif op in sell_ops:
                if use_ticker:
                    qty = tx.qty or 0
                    price = tx.unit_price or 0
                    total_proceeds += qty * price
                    total_sold_qty += qty
                else:
                    total_proceeds += tx.total_value or 0
                    total_sold_qty += tx.total_value or 0
                last_sell_date = str(tx.date)

            total_fees += tx.fees or 0

        # Compute derived values
        avg_buy_price = (total_cost / total_bought_qty) if total_bought_qty else 0
        avg_sell_price = (total_proceeds / total_sold_qty) if total_sold_qty else 0

        # Time held
        time_held_days = 0
        if first_buy_date and last_sell_date:
            from datetime import date as dt_date
            d1 = dt_date.fromisoformat(first_buy_date)
            d2 = dt_date.fromisoformat(last_sell_date)
            time_held_days = (d2 - d1).days

        metrics[key] = {
            "total_cost": round(total_cost, 2),
            "total_proceeds": round(total_proceeds, 2),
            "avg_buy_price": round(avg_buy_price, 2),
            "avg_sell_price": round(avg_sell_price, 2),
            "total_bought_qty": total_bought_qty,
            "total_sold_qty": total_sold_qty,
            "first_buy_date": first_buy_date,
            "last_sell_date": last_sell_date,
            "time_held_days": time_held_days,
            "total_fees": round(total_fees, 2),
            "total_dividends": round(dividends_by_ticker.get(key, 0), 2) if use_ticker else 0,
        }

    return metrics
