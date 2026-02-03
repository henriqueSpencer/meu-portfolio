from fastapi import APIRouter, HTTPException, Query

from ..services.yahoo import fetch_quotes
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
