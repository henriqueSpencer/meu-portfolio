"""
Market data service using yfinance (Yahoo Finance).

BR tickers use the .SA suffix on Yahoo (e.g. PETR4.SA).
International tickers are used as-is (e.g. AAPL, MSFT).
"""

import asyncio
import math
from concurrent.futures import ThreadPoolExecutor

import yfinance as yf

_executor = ThreadPoolExecutor(max_workers=4)

# Yahoo Finance sector names → Portuguese equivalents
SECTOR_PT = {
    "Energy": "Energia",
    "Basic Materials": "Materiais Basicos",
    "Industrials": "Bens Industriais",
    "Consumer Cyclical": "Consumo Ciclico",
    "Consumer Defensive": "Consumo Nao Ciclico",
    "Healthcare": "Saude",
    "Financial Services": "Financeiro",
    "Financial": "Financeiro",
    "Technology": "Tecnologia",
    "Communication Services": "Comunicacoes",
    "Utilities": "Utilidade Publica",
    "Real Estate": "Imoveis",
}

# For FIIs, use industry to determine a more specific sector
FII_INDUSTRY_PT = {
    "REIT - Diversified": "Hibrido",
    "REIT - Industrial": "Logistica",
    "REIT - Retail": "Shopping",
    "REIT - Office": "Lajes Corporativas",
    "REIT - Residential": "Residencial",
    "REIT - Healthcare Facilities": "Hospitalar",
    "REIT - Hotel & Motel": "Hotelaria",
    "REIT - Mortgage": "Papel (CRI)",
    "REIT - Specialty": "Hibrido",
}


def _fetch_quotes_sync(tickers: list[str], suffix: str = ".SA") -> list[dict]:
    """Fetch current quotes for a list of tickers (synchronous)."""
    yahoo_tickers = [f"{t}{suffix}" if suffix and not t.endswith(suffix) else t for t in tickers]
    ticker_str = " ".join(yahoo_tickers)

    data = yf.download(ticker_str, period="1d", group_by="ticker", progress=False, threads=True)

    results = []
    for original, yahoo in zip(tickers, yahoo_tickers):
        try:
            if len(yahoo_tickers) == 1:
                row = data
            else:
                row = data[yahoo] if yahoo in data.columns.get_level_values(0) else None

            if row is not None and not row.empty:
                last = row.iloc[-1]
                close = float(last.get("Close", 0))
                if math.isnan(close):
                    continue
                prev = float(last.get("Open", close))
                if math.isnan(prev):
                    prev = close
                results.append({
                    "symbol": original,
                    "regularMarketPrice": close,
                    "regularMarketPreviousClose": prev,
                })
        except Exception:
            continue

    return results


def _fetch_ticker_info_sync(ticker: str, suffix: str = ".SA") -> dict | None:
    """Fetch detailed info for a single ticker (synchronous)."""
    yahoo_ticker = f"{ticker}{suffix}" if suffix and not ticker.endswith(suffix) else ticker
    try:
        tk = yf.Ticker(yahoo_ticker)
        info = tk.fast_info
        return {
            "symbol": ticker,
            "regularMarketPrice": float(info.last_price) if info.last_price else None,
            "previousClose": float(info.previous_close) if info.previous_close else None,
            "marketCap": float(info.market_cap) if info.market_cap else None,
        }
    except Exception:
        return None


async def fetch_quotes(tickers: list[str], suffix: str = ".SA") -> list[dict]:
    """Fetch current quotes asynchronously via thread pool."""
    if not tickers:
        return []
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_quotes_sync, tickers, suffix)


async def fetch_ticker_info(ticker: str, suffix: str = ".SA") -> dict | None:
    """Fetch detailed ticker info asynchronously."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_ticker_info_sync, ticker, suffix)


def _fetch_asset_info_sync(tickers: list[str], suffix: str = ".SA") -> dict[str, dict]:
    """Fetch sector and name for multiple tickers (synchronous)."""
    results = {}
    for ticker in tickers:
        yahoo_ticker = f"{ticker}{suffix}" if suffix and not ticker.endswith(suffix) else ticker
        try:
            tk = yf.Ticker(yahoo_ticker)
            info = tk.info or {}
            sector_en = info.get("sector", "") or ""
            industry_en = info.get("industry", "") or ""
            long_name = info.get("longName", "") or info.get("shortName", "") or ""

            # For FIIs (REIT industries), use more specific sector from industry
            sector_pt = ""
            if industry_en.startswith("REIT"):
                sector_pt = FII_INDUSTRY_PT.get(industry_en, "")
            if not sector_pt:
                sector_pt = SECTOR_PT.get(sector_en, sector_en) if sector_en else ""

            results[ticker] = {"sector": sector_pt, "name": long_name}
        except Exception:
            results[ticker] = {"sector": "", "name": ""}
    return results


async def fetch_asset_info(tickers: list[str], suffix: str = ".SA") -> dict[str, dict]:
    """Fetch sector and name for multiple tickers asynchronously."""
    if not tickers:
        return {}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_asset_info_sync, tickers, suffix)


def _fetch_single_fundamental(args: tuple) -> tuple[str, dict]:
    """Fetch fundamentals for a single ticker. Returns (ticker, data)."""
    ticker, suffix = args
    yahoo_ticker = f"{ticker}{suffix}" if suffix and not ticker.endswith(suffix) else ticker
    result = {}
    try:
        tk = yf.Ticker(yahoo_ticker)
        info = tk.info or {}

        # Core fundamentals
        eps = info.get("trailingEps")
        if eps is not None:
            result["lpa"] = round(float(eps), 2)

        bv = info.get("bookValue")
        if bv is not None:
            result["vpa"] = round(float(bv), 2)

        ptb = info.get("priceToBook")
        if ptb is not None:
            result["pvp"] = round(float(ptb), 2)

        # Annual dividend rate (R$/share/year) — absolute value, not %
        div_rate = info.get("dividendRate")
        if div_rate is not None:
            result["dy"] = round(float(div_rate), 2)

        last_div = info.get("lastDividendValue")
        if last_div is not None:
            result["last_dividend"] = round(float(last_div), 4)

        # Dividends per year for last 5 complete years
        try:
            divs = tk.dividends
            if divs is not None and len(divs) > 0:
                from datetime import datetime
                current_year = datetime.now().year
                yearly = {}
                for dt, val in divs.items():
                    y = dt.year
                    if current_year - 5 <= y < current_year:
                        yearly[y] = yearly.get(y, 0) + float(val)
                if yearly:
                    result["dividends_5y"] = [
                        round(yearly.get(y, 0), 4)
                        for y in range(current_year - 5, current_year)
                    ]
        except Exception:
            pass

    except Exception:
        pass
    return ticker, result


def _fetch_fundamentals_sync(tickers: list[str], suffix: str = ".SA") -> dict[str, dict]:
    """Fetch fundamentals for multiple tickers using parallel threads."""
    from concurrent.futures import ThreadPoolExecutor as _TPE
    args = [(t, suffix) for t in tickers]
    results = {}
    with _TPE(max_workers=8) as pool:
        for ticker, data in pool.map(_fetch_single_fundamental, args):
            results[ticker] = data
    return results


async def fetch_fundamentals(tickers: list[str], suffix: str = ".SA") -> dict[str, dict]:
    """Fetch fundamentals for multiple tickers asynchronously."""
    if not tickers:
        return {}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_fundamentals_sync, tickers, suffix)
