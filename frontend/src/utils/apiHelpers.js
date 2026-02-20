// Helper: get a value supporting both camelCase and snake_case field names
export const getField = (obj, camel, snake) => obj[camel] ?? obj[snake] ?? 0;

// Convert camelCase tab data to snake_case for API
export function toSnakeCase(obj, type) {
  switch (type) {
    case 'brStock':
      return {
        ticker: obj.ticker,
        name: obj.name,
        sector: obj.sector,
        qty: obj.qty,
        avg_price: obj.avgPrice ?? obj.avg_price ?? 0,
        current_price: obj.currentPrice ?? obj.current_price ?? 0,
        lpa: obj.lpa ?? null,
        vpa: obj.vpa ?? null,
        dividends_5y: obj.dividends5y ?? obj.dividends_5y ?? [],
        fair_price_manual: obj.fairPriceManual ?? obj.fair_price_manual ?? null,
        broker: obj.broker || '',
      };
    case 'fii':
      return {
        ticker: obj.ticker,
        name: obj.name,
        sector: obj.sector,
        qty: obj.qty,
        avg_price: obj.avgPrice ?? obj.avg_price ?? 0,
        current_price: obj.currentPrice ?? obj.current_price ?? 0,
        pvp: obj.pvp ?? 0,
        dy_12m: obj.dy12m ?? obj.dy_12m ?? 0,
        last_dividend: obj.lastDividend ?? obj.last_dividend ?? 0,
        broker: obj.broker || '',
      };
    case 'intlStock':
      return {
        ticker: obj.ticker,
        name: obj.name,
        sector: obj.sector,
        type: obj.type || 'Stock',
        qty: obj.qty,
        avg_price_usd: obj.avgPriceUsd ?? obj.avg_price_usd ?? 0,
        current_price_usd: obj.currentPriceUsd ?? obj.current_price_usd ?? 0,
        lpa: obj.lpa ?? null,
        vpa: obj.vpa ?? null,
        dividends_5y: obj.dividends5y ?? obj.dividends_5y ?? [],
        fair_price_manual: obj.fairPriceManual ?? obj.fair_price_manual ?? null,
        broker: obj.broker || '',
      };
    case 'fixedIncome':
      return {
        id: obj.id,
        title: obj.title,
        type: obj.type,
        rate: obj.rate,
        applied_value: obj.appliedValue ?? obj.applied_value ?? 0,
        current_value: obj.currentValue ?? obj.current_value ?? 0,
        application_date: obj.applicationDate ?? obj.application_date,
        maturity_date: obj.maturityDate ?? obj.maturity_date,
        broker: obj.broker || '',
        indexer: obj.indexer || 'CDI',
        contracted_rate: obj.contractedRate ?? obj.contracted_rate ?? 0,
        tax_exempt: obj.taxExempt ?? obj.tax_exempt ?? false,
        is_closed: obj.isClosed ?? obj.is_closed ?? false,
      };
    case 'realAsset':
      return {
        id: obj.id,
        description: obj.description,
        type: obj.type,
        estimated_value: obj.estimatedValue ?? obj.estimated_value ?? 0,
        acquisition_date: obj.acquisitionDate ?? obj.acquisition_date,
        include_in_total: obj.includeInTotal ?? obj.include_in_total ?? true,
        is_closed: obj.isClosed ?? obj.is_closed ?? false,
      };
    case 'watchlist':
      return {
        ticker: obj.ticker,
        name: obj.name,
        current_price: obj.currentPrice ?? obj.current_price ?? 0,
        fair_price: obj.fairPrice ?? obj.fair_price ?? 0,
        target_price: obj.targetPrice ?? obj.target_price ?? 0,
        status: obj.status || 'Interesse',
        sector: obj.sector || '',
      };
    case 'allocationTarget':
      return {
        asset_class: obj.assetClass ?? obj.asset_class,
        target: obj.target ?? 0,
        target_type: obj.targetType ?? obj.target_type ?? 'percentage',
        icon: obj.icon || '',
      };
    case 'accGoal':
      return {
        id: obj.id,
        ticker: obj.ticker,
        target_qty: obj.targetQty ?? obj.target_qty ?? 0,
        target_type: obj.targetType ?? obj.target_type ?? 'qty',
        target_value: obj.targetValue ?? obj.target_value ?? 0,
        note: obj.note || '',
      };
    case 'transaction':
      return {
        date: obj.date,
        operation_type: obj.operationType ?? obj.operation_type,
        asset_class: obj.assetClass ?? obj.asset_class,
        ticker: obj.ticker || null,
        asset_id: obj.assetId ?? obj.asset_id ?? null,
        asset_name: obj.assetName ?? obj.asset_name,
        qty: obj.qty ?? null,
        unit_price: obj.unitPrice ?? obj.unit_price ?? null,
        total_value: obj.totalValue ?? obj.total_value ?? null,
        broker: obj.broker || '',
        broker_destination: obj.brokerDestination ?? obj.broker_destination ?? null,
        fees: obj.fees ?? 0,
        notes: obj.notes || null,
      };
    case 'fiEtf':
      return {
        ticker: obj.ticker,
        name: obj.name,
        qty: obj.qty,
        avg_price: obj.avgPrice ?? obj.avg_price ?? 0,
        current_price: obj.currentPrice ?? obj.current_price ?? 0,
        broker: obj.broker || '',
      };
    case 'cashAccount':
      return {
        id: obj.id,
        name: obj.name,
        type: obj.type,
        institution: obj.institution || '',
        balance: obj.balance ?? 0,
        currency: obj.currency || 'BRL',
      };
    default:
      return obj;
  }
}
