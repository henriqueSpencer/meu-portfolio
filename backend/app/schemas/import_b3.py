from pydantic import BaseModel
import datetime


class ImportedRow(BaseModel):
    date: datetime.date
    operation_type: str  # compra | venda
    market: str  # original market string from B3
    asset_class: str  # br_stock | fii | fi_etf
    ticker: str
    qty: int
    unit_price: float
    total_value: float
    broker: str
    asset_name: str  # = ticker (filled later if asset exists)
    asset_exists: bool = False
    is_duplicate: bool = False
    is_skipped: bool = False
    skip_reason: str | None = None


class ImportSummary(BaseModel):
    total: int
    new: int
    duplicates: int
    skipped: int
    new_assets: list[str]


class ImportPreviewResponse(BaseModel):
    rows: list[ImportedRow]
    summary: ImportSummary


class ImportConfirmRequest(BaseModel):
    rows: list[ImportedRow]


class ImportConfirmResponse(BaseModel):
    created: int
    assets_created: list[str]
    errors: list[str]
