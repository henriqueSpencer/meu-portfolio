import httpx

BCB_SGS_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"


async def _fetch_series(code: int) -> float:
    url = f"{BCB_SGS_BASE}.{code}/dados/ultimos/1?formato=json"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            raise ValueError(f"BCB series {code}: empty response")
        return float(data[0]["valor"])


async def fetch_exchange_rate() -> float:
    return await _fetch_series(1)


async def fetch_selic() -> float:
    return await _fetch_series(4189)


async def fetch_cdi() -> float:
    return await _fetch_series(4391)


async def fetch_ipca() -> float:
    return await _fetch_series(433)


async def fetch_historical_series(
    codes: list[int], start_date: str, end_date: str
) -> dict[int, list[dict]]:
    """Fetch multiple BCB SGS historical series in a date range.

    Args:
        codes: list of BCB series codes (e.g. [12, 433, 11])
        start_date: DD/MM/YYYY format
        end_date: DD/MM/YYYY format

    Returns:
        dict keyed by series code, each value is a list of {date, value} dicts.
    """
    results: dict[int, list[dict]] = {}
    async with httpx.AsyncClient(timeout=30) as client:
        for code in codes:
            try:
                url = (
                    f"{BCB_SGS_BASE}.{code}/dados"
                    f"?formato=json&dataInicial={start_date}&dataFinal={end_date}"
                )
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                results[code] = [
                    {"date": entry["data"], "value": float(entry["valor"])}
                    for entry in data
                    if entry.get("valor") is not None
                ]
            except Exception:
                results[code] = []
    return results
