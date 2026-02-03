"""
Market data service using yfinance (Yahoo Finance).

BR tickers use the .SA suffix on Yahoo (e.g. PETR4.SA).
International tickers are used as-is (e.g. AAPL, MSFT).
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor

import yfinance as yf

_executor = ThreadPoolExecutor(max_workers=4)


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
                results.append({
                    "symbol": original,
                    "regularMarketPrice": close,
                    "regularMarketPreviousClose": float(last.get("Open", close)),
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
