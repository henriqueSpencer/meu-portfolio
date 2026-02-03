from fastapi import APIRouter, HTTPException, Query

from ..services.yahoo import fetch_quotes
from ..services.bcb import fetch_exchange_rate, fetch_selic, fetch_cdi, fetch_ipca

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
