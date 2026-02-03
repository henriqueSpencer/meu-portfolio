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
