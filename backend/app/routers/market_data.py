from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.br_stock import BrStock
from ..models.fii import Fii
from ..models.intl_stock import IntlStock
from ..services.yahoo import fetch_quotes, fetch_asset_info, fetch_fundamentals
from ..services.bcb import fetch_exchange_rate, fetch_selic, fetch_cdi, fetch_ipca, fetch_historical_series

router = APIRouter(prefix="/api/market-data", tags=["market-data"])


@router.get("/quotes")
async def get_quotes(tickers: str = Query(..., description="Comma-separated tickers")):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(400, "No tickers provided")
    try:
        result = await fetch_quotes(ticker_list, suffix=".SA")
        return {"results": result}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch quotes: {e}")


@router.get("/quotes/intl")
async def get_intl_quotes(tickers: str = Query(..., description="Comma-separated tickers")):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(400, "No tickers provided")
    try:
        result = await fetch_quotes(ticker_list, suffix="")
        return {"results": result}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch intl quotes: {e}")


@router.get("/exchange-rate")
async def get_exchange_rate():
    try:
        rate = await fetch_exchange_rate()
        return {"rate": rate}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch exchange rate: {e}")


@router.get("/indicators")
async def get_indicators():
    errors = {}
    result = {}
    for name, fn in [("selic", fetch_selic), ("cdi", fetch_cdi), ("ipca", fetch_ipca)]:
        try:
            result[name] = await fn()
        except Exception as e:
            errors[name] = str(e)
    if errors:
        result["errors"] = errors
    return result


@router.post("/update-sectors")
async def update_sectors(db: AsyncSession = Depends(get_db)):
    """Fetch sectors from Yahoo Finance for all assets with 'A classificar'."""
    updated = []

    # BR stocks
    result = await db.execute(select(BrStock).where(BrStock.sector == "A classificar"))
    br_stocks = result.scalars().all()

    # FIIs
    result = await db.execute(select(Fii).where(Fii.sector == "A classificar"))
    fiis = result.scalars().all()

    # Intl stocks
    result = await db.execute(select(IntlStock).where(IntlStock.sector == "A classificar"))
    intl_stocks = result.scalars().all()

    # Fetch info for BR tickers
    br_tickers = [s.ticker for s in br_stocks] + [f.ticker for f in fiis]
    intl_tickers = [s.ticker for s in intl_stocks]

    br_info = {}
    intl_info = {}
    if br_tickers:
        try:
            br_info = await fetch_asset_info(br_tickers, suffix=".SA")
        except Exception:
            pass
    if intl_tickers:
        try:
            intl_info = await fetch_asset_info(intl_tickers, suffix="")
        except Exception:
            pass

    for asset in br_stocks + fiis:
        info = br_info.get(asset.ticker, {})
        sector = info.get("sector")
        if sector:
            asset.sector = sector
            if info.get("name"):
                asset.name = info["name"]
            updated.append(asset.ticker)

    for asset in intl_stocks:
        info = intl_info.get(asset.ticker, {})
        sector = info.get("sector")
        if sector:
            asset.sector = sector
            if info.get("name"):
                asset.name = info["name"]
            updated.append(asset.ticker)

    await db.commit()
    return {"updated": updated, "count": len(updated)}


@router.get("/fundamentals")
async def get_fundamentals(
    tickers: str = Query(..., description="Comma-separated tickers"),
    market: str = Query("br", description="Market: 'br' (adds .SA suffix) or 'intl'"),
):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(400, "No tickers provided")
    suffix = ".SA" if market == "br" else ""
    try:
        result = await fetch_fundamentals(ticker_list, suffix=suffix)
        return {"results": result}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch fundamentals: {e}")


@router.get("/historical-rates")
async def get_historical_rates(
    series: str = Query(..., description="Comma-separated BCB series codes (e.g. 12,433,11)"),
    start: str = Query(..., description="Start date DD/MM/YYYY"),
    end: str = Query(..., description="End date DD/MM/YYYY"),
):
    codes = []
    for s in series.split(","):
        s = s.strip()
        if not s.isdigit():
            raise HTTPException(400, f"Invalid series code: {s}")
        codes.append(int(s))
    if not codes:
        raise HTTPException(400, "No series codes provided")
    try:
        data = await fetch_historical_series(codes, start, end)
        return {str(k): v for k, v in data.items()}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch historical rates: {e}")
