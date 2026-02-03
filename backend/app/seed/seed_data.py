import datetime

BR_STOCKS = [
    {"ticker": "PETR4", "name": "Petrobras PN", "sector": "Petroleo e Gas", "qty": 200, "avg_price": 28.50, "current_price": 37.80, "lpa": 7.12, "vpa": 30.45, "dividends_5y": [3.80, 4.20, 3.50, 5.10, 4.60], "fair_price_manual": None, "broker": "BTG"},
    {"ticker": "VALE3", "name": "Vale ON", "sector": "Mineracao", "qty": 150, "avg_price": 68.00, "current_price": 62.30, "lpa": 10.25, "vpa": 52.80, "dividends_5y": [4.50, 6.80, 5.20, 3.90, 5.60], "fair_price_manual": None, "broker": "BTG"},
    {"ticker": "ITUB4", "name": "Itau Unibanco PN", "sector": "Bancos", "qty": 300, "avg_price": 25.20, "current_price": 33.40, "lpa": 3.85, "vpa": 18.90, "dividends_5y": [1.20, 1.35, 1.10, 1.50, 1.40], "fair_price_manual": None, "broker": "BTG"},
    {"ticker": "WEGE3", "name": "WEG ON", "sector": "Bens Industriais", "qty": 100, "avg_price": 35.00, "current_price": 52.10, "lpa": 1.45, "vpa": 5.20, "dividends_5y": [0.55, 0.62, 0.48, 0.70, 0.58], "fair_price_manual": 42.00, "broker": "BTG"},
    {"ticker": "BBAS3", "name": "Banco do Brasil ON", "sector": "Bancos", "qty": 250, "avg_price": 42.00, "current_price": 56.70, "lpa": 8.90, "vpa": 48.20, "dividends_5y": [2.80, 3.20, 2.50, 3.80, 3.40], "fair_price_manual": None, "broker": "BTG"},
    {"ticker": "ABEV3", "name": "Ambev ON", "sector": "Bebidas", "qty": 400, "avg_price": 14.80, "current_price": 12.90, "lpa": 0.98, "vpa": 5.60, "dividends_5y": [0.60, 0.55, 0.48, 0.65, 0.58], "fair_price_manual": None, "broker": "BTG"},
    {"ticker": "RENT3", "name": "Localiza ON", "sector": "Locacao de Veiculos", "qty": 80, "avg_price": 58.00, "current_price": 48.20, "lpa": 3.20, "vpa": 22.10, "dividends_5y": [0.90, 1.10, 0.80, 1.30, 1.05], "fair_price_manual": None, "broker": "BTG"},
    {"ticker": "SUZB3", "name": "Suzano ON", "sector": "Papel e Celulose", "qty": 60, "avg_price": 45.00, "current_price": 58.40, "lpa": 5.80, "vpa": 28.90, "dividends_5y": [0.40, 0.55, 0.30, 0.70, 0.50], "fair_price_manual": None, "broker": "BTG"},
]

FIIS = [
    {"ticker": "HGLG11", "name": "CSHG Logistica FII", "sector": "Logistica", "qty": 50, "avg_price": 162.00, "current_price": 158.50, "pvp": 0.97, "dy_12m": 8.2, "last_dividend": 1.10, "broker": "BTG"},
    {"ticker": "XPLG11", "name": "XP Log FII", "sector": "Logistica", "qty": 80, "avg_price": 98.00, "current_price": 102.40, "pvp": 1.02, "dy_12m": 7.8, "last_dividend": 0.68, "broker": "BTG"},
    {"ticker": "MXRF11", "name": "Maxi Renda FII", "sector": "Papel (CRI)", "qty": 200, "avg_price": 10.20, "current_price": 10.05, "pvp": 0.98, "dy_12m": 11.5, "last_dividend": 0.10, "broker": "BTG"},
    {"ticker": "KNRI11", "name": "Kinea Renda Imob FII", "sector": "Hibrido", "qty": 30, "avg_price": 140.00, "current_price": 135.80, "pvp": 0.94, "dy_12m": 7.5, "last_dividend": 0.85, "broker": "BTG"},
]

INTL_STOCKS = [
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology", "type": "Stock", "qty": 15, "avg_price_usd": 155.00, "current_price_usd": 192.50, "lpa": 6.42, "vpa": 3.95, "dividends_5y": [0.82, 0.88, 0.92, 0.96, 1.00], "fair_price_manual": None, "broker": "Avenue"},
    {"ticker": "MSFT", "name": "Microsoft Corp.", "sector": "Technology", "type": "Stock", "qty": 10, "avg_price_usd": 280.00, "current_price_usd": 415.20, "lpa": 11.05, "vpa": 29.60, "dividends_5y": [2.24, 2.48, 2.72, 2.96, 3.00], "fair_price_manual": None, "broker": "Avenue"},
    {"ticker": "VOO", "name": "Vanguard S&P 500 ETF", "sector": "Index Fund", "type": "ETF", "qty": 8, "avg_price_usd": 380.00, "current_price_usd": 502.30, "lpa": None, "vpa": None, "dividends_5y": [5.50, 5.90, 6.10, 6.30, 6.50], "fair_price_manual": None, "broker": "Avenue"},
    {"ticker": "VNQ", "name": "Vanguard Real Estate ETF", "sector": "Real Estate", "type": "REIT", "qty": 20, "avg_price_usd": 82.00, "current_price_usd": 88.60, "lpa": None, "vpa": None, "dividends_5y": [3.20, 2.80, 3.40, 3.60, 3.80], "fair_price_manual": None, "broker": "Avenue"},
]

FIXED_INCOME = [
    {"id": "rf1", "title": "Tesouro IPCA+ 2029", "type": "Tesouro Direto", "rate": "IPCA + 6.20%", "applied_value": 50000, "current_value": 58200, "application_date": datetime.date(2023, 3, 15), "maturity_date": datetime.date(2029, 5, 15), "broker": "BTG"},
    {"id": "rf2", "title": "CDB Banco Inter 120% CDI", "type": "CDB", "rate": "120% CDI", "applied_value": 30000, "current_value": 34800, "application_date": datetime.date(2023, 8, 10), "maturity_date": datetime.date(2026, 8, 10), "broker": "BTG"},
    {"id": "rf3", "title": "LCI Itau 95% CDI", "type": "LCI", "rate": "95% CDI", "applied_value": 20000, "current_value": 22100, "application_date": datetime.date(2024, 1, 20), "maturity_date": datetime.date(2027, 1, 20), "broker": "BTG"},
]

REAL_ASSETS = [
    {"id": "ra1", "description": "Apartamento 2Q - Belo Horizonte", "type": "Imovel", "estimated_value": 450000, "acquisition_date": datetime.date(2021, 6, 1), "include_in_total": True},
    {"id": "ra2", "description": "Honda Civic 2022", "type": "Veiculo", "estimated_value": 115000, "acquisition_date": datetime.date(2022, 3, 15), "include_in_total": False},
]

DIVIDENDS = [
    {"date": datetime.date(2025, 8, 5), "ticker": "PETR4", "type": "Dividendo", "value": 380.00},
    {"date": datetime.date(2025, 8, 10), "ticker": "HGLG11", "type": "Rendimento", "value": 55.00},
    {"date": datetime.date(2025, 8, 10), "ticker": "XPLG11", "type": "Rendimento", "value": 54.40},
    {"date": datetime.date(2025, 8, 10), "ticker": "MXRF11", "type": "Rendimento", "value": 20.00},
    {"date": datetime.date(2025, 8, 10), "ticker": "KNRI11", "type": "Rendimento", "value": 25.50},
    {"date": datetime.date(2025, 8, 20), "ticker": "ITUB4", "type": "JCP", "value": 120.00},
    {"date": datetime.date(2025, 8, 25), "ticker": "AAPL", "type": "Dividendo", "value": 22.50},
    {"date": datetime.date(2025, 9, 5), "ticker": "BBAS3", "type": "Dividendo", "value": 200.00},
    {"date": datetime.date(2025, 9, 10), "ticker": "HGLG11", "type": "Rendimento", "value": 55.00},
    {"date": datetime.date(2025, 9, 10), "ticker": "XPLG11", "type": "Rendimento", "value": 54.40},
    {"date": datetime.date(2025, 9, 10), "ticker": "MXRF11", "type": "Rendimento", "value": 20.00},
    {"date": datetime.date(2025, 9, 10), "ticker": "KNRI11", "type": "Rendimento", "value": 25.50},
    {"date": datetime.date(2025, 9, 15), "ticker": "VALE3", "type": "Dividendo", "value": 450.00},
    {"date": datetime.date(2025, 9, 28), "ticker": "VOO", "type": "Dividendo", "value": 39.00},
    {"date": datetime.date(2025, 10, 5), "ticker": "PETR4", "type": "Dividendo", "value": 400.00},
    {"date": datetime.date(2025, 10, 10), "ticker": "HGLG11", "type": "Rendimento", "value": 55.00},
    {"date": datetime.date(2025, 10, 10), "ticker": "XPLG11", "type": "Rendimento", "value": 54.40},
    {"date": datetime.date(2025, 10, 10), "ticker": "MXRF11", "type": "Rendimento", "value": 20.00},
    {"date": datetime.date(2025, 10, 10), "ticker": "KNRI11", "type": "Rendimento", "value": 25.50},
    {"date": datetime.date(2025, 10, 20), "ticker": "ITUB4", "type": "JCP", "value": 135.00},
    {"date": datetime.date(2025, 10, 25), "ticker": "MSFT", "type": "Dividendo", "value": 30.00},
    {"date": datetime.date(2025, 11, 5), "ticker": "WEGE3", "type": "Dividendo", "value": 58.00},
    {"date": datetime.date(2025, 11, 10), "ticker": "HGLG11", "type": "Rendimento", "value": 55.00},
    {"date": datetime.date(2025, 11, 10), "ticker": "XPLG11", "type": "Rendimento", "value": 54.40},
    {"date": datetime.date(2025, 11, 10), "ticker": "MXRF11", "type": "Rendimento", "value": 20.00},
    {"date": datetime.date(2025, 11, 10), "ticker": "KNRI11", "type": "Rendimento", "value": 25.50},
    {"date": datetime.date(2025, 11, 15), "ticker": "BBAS3", "type": "JCP", "value": 280.00},
    {"date": datetime.date(2025, 11, 20), "ticker": "ABEV3", "type": "Dividendo", "value": 96.00},
    {"date": datetime.date(2025, 11, 28), "ticker": "AAPL", "type": "Dividendo", "value": 22.50},
    {"date": datetime.date(2025, 12, 5), "ticker": "PETR4", "type": "Dividendo", "value": 420.00},
    {"date": datetime.date(2025, 12, 10), "ticker": "HGLG11", "type": "Rendimento", "value": 56.00},
    {"date": datetime.date(2025, 12, 10), "ticker": "XPLG11", "type": "Rendimento", "value": 55.00},
    {"date": datetime.date(2025, 12, 10), "ticker": "MXRF11", "type": "Rendimento", "value": 20.00},
    {"date": datetime.date(2025, 12, 10), "ticker": "KNRI11", "type": "Rendimento", "value": 26.00},
    {"date": datetime.date(2025, 12, 15), "ticker": "VALE3", "type": "Dividendo", "value": 480.00},
    {"date": datetime.date(2025, 12, 20), "ticker": "SUZB3", "type": "Dividendo", "value": 42.00},
    {"date": datetime.date(2025, 12, 28), "ticker": "VOO", "type": "Dividendo", "value": 41.00},
    {"date": datetime.date(2026, 1, 5), "ticker": "ITUB4", "type": "JCP", "value": 140.00},
    {"date": datetime.date(2026, 1, 10), "ticker": "HGLG11", "type": "Rendimento", "value": 56.00},
    {"date": datetime.date(2026, 1, 10), "ticker": "XPLG11", "type": "Rendimento", "value": 55.00},
    {"date": datetime.date(2026, 1, 10), "ticker": "MXRF11", "type": "Rendimento", "value": 20.50},
    {"date": datetime.date(2026, 1, 10), "ticker": "KNRI11", "type": "Rendimento", "value": 26.00},
    {"date": datetime.date(2026, 1, 15), "ticker": "BBAS3", "type": "Dividendo", "value": 310.00},
    {"date": datetime.date(2026, 1, 20), "ticker": "RENT3", "type": "Dividendo", "value": 32.00},
    {"date": datetime.date(2026, 1, 25), "ticker": "MSFT", "type": "Dividendo", "value": 30.00},
    {"date": datetime.date(2026, 2, 2), "ticker": "PETR4", "type": "Dividendo", "value": 410.00},
    {"date": datetime.date(2026, 2, 3), "ticker": "HGLG11", "type": "Rendimento", "value": 57.00},
    {"date": datetime.date(2026, 2, 3), "ticker": "XPLG11", "type": "Rendimento", "value": 56.00},
    {"date": datetime.date(2026, 2, 3), "ticker": "MXRF11", "type": "Rendimento", "value": 21.00},
    {"date": datetime.date(2026, 2, 3), "ticker": "KNRI11", "type": "Rendimento", "value": 26.50},
]

WATCHLIST = [
    {"ticker": "TAEE11", "name": "Taesa UNT", "current_price": 36.50, "fair_price": 42.00, "target_price": 33.00, "status": "Interesse", "sector": "Energia Eletrica"},
    {"ticker": "EGIE3", "name": "Engie Brasil ON", "current_price": 43.80, "fair_price": 48.00, "target_price": 40.00, "status": "Interesse", "sector": "Energia Eletrica"},
    {"ticker": "PETR4", "name": "Petrobras PN", "current_price": 37.80, "fair_price": 42.70, "target_price": 35.00, "status": "Possui", "sector": "Petroleo e Gas"},
    {"ticker": "FLRY3", "name": "Fleury ON", "current_price": 15.20, "fair_price": 19.50, "target_price": 14.50, "status": "Interesse", "sector": "Saude"},
]

ALLOCATION_TARGETS = [
    {"asset_class": "RV Brasil", "target": 30, "icon": "TrendingUp"},
    {"asset_class": "FIIs", "target": 15, "icon": "Building2"},
    {"asset_class": "RV Exterior", "target": 20, "icon": "Globe"},
    {"asset_class": "Renda Fixa", "target": 25, "icon": "Shield"},
    {"asset_class": "Cripto", "target": 5, "icon": "Bitcoin"},
    {"asset_class": "Reserva Emergencia", "target": 5, "icon": "Wallet"},
]

ACCUMULATION_GOALS = [
    {"id": "goal-1", "ticker": "ITUB4", "target_qty": 500, "note": "Acumular banco perene"},
    {"id": "goal-2", "ticker": "BBAS3", "target_qty": 400, "note": "Pilar de dividendos bancarios"},
    {"id": "goal-3", "ticker": "HGLG11", "target_qty": 100, "note": "Renda passiva com logistica"},
    {"id": "goal-4", "ticker": "PETR4", "target_qty": 300, "note": "Dividendos extraordinarios"},
]

PATRIMONIAL_HISTORY = [
    {"month": "Ago/25", "total": 485000, "cdi": 100, "ibov": 100, "ipca6": 100, "sp500": 100},
    {"month": "Set/25", "total": 498000, "cdi": 100.9, "ibov": 102.1, "ipca6": 100.8, "sp500": 101.5},
    {"month": "Out/25", "total": 510000, "cdi": 101.8, "ibov": 99.5, "ipca6": 101.6, "sp500": 103.2},
    {"month": "Nov/25", "total": 522000, "cdi": 102.7, "ibov": 101.8, "ipca6": 102.4, "sp500": 105.1},
    {"month": "Dez/25", "total": 535000, "cdi": 103.6, "ibov": 104.2, "ipca6": 103.2, "sp500": 104.8},
    {"month": "Jan/26", "total": 548000, "cdi": 104.5, "ibov": 103.5, "ipca6": 104.0, "sp500": 106.5},
    {"month": "Fev/26", "total": 560000, "cdi": 105.4, "ibov": 105.0, "ipca6": 104.8, "sp500": 108.2},
]

BENCHMARKS = {
    "cdi": {"month": 0.87, "ytd": 0.87, "year": 10.75, "sinceStart": 4.5},
    "ibov": {"month": -0.68, "ytd": -0.68, "year": 3.5, "sinceStart": 3.5},
    "ipca6": {"month": 0.78, "ytd": 0.78, "year": 10.2, "sinceStart": 4.0},
    "sp500": {"month": 1.62, "ytd": 1.62, "year": 18.5, "sinceStart": 6.5},
}

ACCUMULATION_HISTORY = [
    {"month": "Ago/25", "totalShares": 1650, "brShares": 1340, "fiiShares": 310},
    {"month": "Set/25", "totalShares": 1700, "brShares": 1380, "fiiShares": 320},
    {"month": "Out/25", "totalShares": 1750, "brShares": 1410, "fiiShares": 340},
    {"month": "Nov/25", "totalShares": 1810, "brShares": 1460, "fiiShares": 350},
    {"month": "Dez/25", "totalShares": 1860, "brShares": 1500, "fiiShares": 360},
    {"month": "Jan/26", "totalShares": 1900, "brShares": 1540, "fiiShares": 360},
]
