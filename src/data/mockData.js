// ========================================================
// DADOS MOCK - Dados fictícios realistas para demonstração
// ========================================================

export const EXCHANGE_RATE = 6.05; // USD -> BRL

// --------------------------------------------------------
// Ações Brasileiras
// --------------------------------------------------------
export const brStocks = [
  {
    ticker: 'PETR4', name: 'Petrobras PN', sector: 'Petróleo e Gás',
    qty: 200, avgPrice: 28.50, currentPrice: 37.80,
    lpa: 7.12, vpa: 30.45, dividends5y: [3.80, 4.20, 3.50, 5.10, 4.60],
    fairPriceManual: null, broker: 'BTG',
  },
  {
    ticker: 'VALE3', name: 'Vale ON', sector: 'Mineração',
    qty: 150, avgPrice: 68.00, currentPrice: 62.30,
    lpa: 10.25, vpa: 52.80, dividends5y: [4.50, 6.80, 5.20, 3.90, 5.60],
    fairPriceManual: null, broker: 'BTG',
  },
  {
    ticker: 'ITUB4', name: 'Itaú Unibanco PN', sector: 'Bancos',
    qty: 300, avgPrice: 25.20, currentPrice: 33.40,
    lpa: 3.85, vpa: 18.90, dividends5y: [1.20, 1.35, 1.10, 1.50, 1.40],
    fairPriceManual: null, broker: 'BTG',
  },
  {
    ticker: 'WEGE3', name: 'WEG ON', sector: 'Bens Industriais',
    qty: 100, avgPrice: 35.00, currentPrice: 52.10,
    lpa: 1.45, vpa: 5.20, dividends5y: [0.55, 0.62, 0.48, 0.70, 0.58],
    fairPriceManual: 42.00, broker: 'BTG',
  },
  {
    ticker: 'BBAS3', name: 'Banco do Brasil ON', sector: 'Bancos',
    qty: 250, avgPrice: 42.00, currentPrice: 56.70,
    lpa: 8.90, vpa: 48.20, dividends5y: [2.80, 3.20, 2.50, 3.80, 3.40],
    fairPriceManual: null, broker: 'BTG',
  },
  {
    ticker: 'ABEV3', name: 'Ambev ON', sector: 'Bebidas',
    qty: 400, avgPrice: 14.80, currentPrice: 12.90,
    lpa: 0.98, vpa: 5.60, dividends5y: [0.60, 0.55, 0.48, 0.65, 0.58],
    fairPriceManual: null, broker: 'BTG',
  },
  {
    ticker: 'RENT3', name: 'Localiza ON', sector: 'Locação de Veículos',
    qty: 80, avgPrice: 58.00, currentPrice: 48.20,
    lpa: 3.20, vpa: 22.10, dividends5y: [0.90, 1.10, 0.80, 1.30, 1.05],
    fairPriceManual: null, broker: 'BTG',
  },
  {
    ticker: 'SUZB3', name: 'Suzano ON', sector: 'Papel e Celulose',
    qty: 60, avgPrice: 45.00, currentPrice: 58.40,
    lpa: 5.80, vpa: 28.90, dividends5y: [0.40, 0.55, 0.30, 0.70, 0.50],
    fairPriceManual: null, broker: 'BTG',
  },
];

// --------------------------------------------------------
// FIIs (Fundos Imobiliários)
// --------------------------------------------------------
export const fiis = [
  {
    ticker: 'HGLG11', name: 'CSHG Logística FII', sector: 'Logística',
    qty: 50, avgPrice: 162.00, currentPrice: 158.50,
    pvp: 0.97, dy12m: 8.2, lastDividend: 1.10, broker: 'BTG',
  },
  {
    ticker: 'XPLG11', name: 'XP Log FII', sector: 'Logística',
    qty: 80, avgPrice: 98.00, currentPrice: 102.40,
    pvp: 1.02, dy12m: 7.8, lastDividend: 0.68, broker: 'BTG',
  },
  {
    ticker: 'MXRF11', name: 'Maxi Renda FII', sector: 'Papel (CRI)',
    qty: 200, avgPrice: 10.20, currentPrice: 10.05,
    pvp: 0.98, dy12m: 11.5, lastDividend: 0.10, broker: 'BTG',
  },
  {
    ticker: 'KNRI11', name: 'Kinea Renda Imob FII', sector: 'Híbrido',
    qty: 30, avgPrice: 140.00, currentPrice: 135.80,
    pvp: 0.94, dy12m: 7.5, lastDividend: 0.85, broker: 'BTG',
  },
];

// --------------------------------------------------------
// Renda Variável Exterior
// --------------------------------------------------------
export const intlStocks = [
  {
    ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', type: 'Stock',
    qty: 15, avgPriceUsd: 155.00, currentPriceUsd: 192.50,
    lpa: 6.42, vpa: 3.95, dividends5y: [0.82, 0.88, 0.92, 0.96, 1.00],
    fairPriceManual: null, broker: 'Avenue',
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', type: 'Stock',
    qty: 10, avgPriceUsd: 280.00, currentPriceUsd: 415.20,
    lpa: 11.05, vpa: 29.60, dividends5y: [2.24, 2.48, 2.72, 2.96, 3.00],
    fairPriceManual: null, broker: 'Avenue',
  },
  {
    ticker: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'Index Fund', type: 'ETF',
    qty: 8, avgPriceUsd: 380.00, currentPriceUsd: 502.30,
    lpa: null, vpa: null, dividends5y: [5.50, 5.90, 6.10, 6.30, 6.50],
    fairPriceManual: null, broker: 'Avenue',
  },
  {
    ticker: 'VNQ', name: 'Vanguard Real Estate ETF', sector: 'Real Estate', type: 'REIT',
    qty: 20, avgPriceUsd: 82.00, currentPriceUsd: 88.60,
    lpa: null, vpa: null, dividends5y: [3.20, 2.80, 3.40, 3.60, 3.80],
    fairPriceManual: null, broker: 'Avenue',
  },
];

// --------------------------------------------------------
// Renda Fixa
// --------------------------------------------------------
export const fixedIncome = [
  {
    id: 'rf1',
    title: 'Tesouro IPCA+ 2029',
    type: 'Tesouro Direto',
    rate: 'IPCA + 6.20%',
    appliedValue: 50000,
    currentValue: 58200,
    applicationDate: '2023-03-15',
    maturityDate: '2029-05-15',
    broker: 'BTG',
  },
  {
    id: 'rf2',
    title: 'CDB Banco Inter 120% CDI',
    type: 'CDB',
    rate: '120% CDI',
    appliedValue: 30000,
    currentValue: 34800,
    applicationDate: '2023-08-10',
    maturityDate: '2026-08-10',
    broker: 'BTG',
  },
  {
    id: 'rf3',
    title: 'LCI Itaú 95% CDI',
    type: 'LCI',
    rate: '95% CDI',
    appliedValue: 20000,
    currentValue: 22100,
    applicationDate: '2024-01-20',
    maturityDate: '2027-01-20',
    broker: 'BTG',
  },
];

// --------------------------------------------------------
// Ativos Imobilizados
// --------------------------------------------------------
export const realAssets = [
  {
    id: 'ra1',
    description: 'Apartamento 2Q - Belo Horizonte',
    type: 'Imóvel',
    estimatedValue: 450000,
    acquisitionDate: '2021-06-01',
    includeInTotal: true,
  },
  {
    id: 'ra2',
    description: 'Honda Civic 2022',
    type: 'Veículo',
    estimatedValue: 115000,
    acquisitionDate: '2022-03-15',
    includeInTotal: false,
  },
];

// --------------------------------------------------------
// Histórico de Proventos (últimos 6 meses)
// --------------------------------------------------------
export const dividendHistory = [
  // Agosto 2025
  { date: '2025-08-05', ticker: 'PETR4', type: 'Dividendo', value: 380.00 },
  { date: '2025-08-10', ticker: 'HGLG11', type: 'Rendimento', value: 55.00 },
  { date: '2025-08-10', ticker: 'XPLG11', type: 'Rendimento', value: 54.40 },
  { date: '2025-08-10', ticker: 'MXRF11', type: 'Rendimento', value: 20.00 },
  { date: '2025-08-10', ticker: 'KNRI11', type: 'Rendimento', value: 25.50 },
  { date: '2025-08-20', ticker: 'ITUB4', type: 'JCP', value: 120.00 },
  { date: '2025-08-25', ticker: 'AAPL', type: 'Dividendo', value: 22.50 },
  // Setembro 2025
  { date: '2025-09-05', ticker: 'BBAS3', type: 'Dividendo', value: 200.00 },
  { date: '2025-09-10', ticker: 'HGLG11', type: 'Rendimento', value: 55.00 },
  { date: '2025-09-10', ticker: 'XPLG11', type: 'Rendimento', value: 54.40 },
  { date: '2025-09-10', ticker: 'MXRF11', type: 'Rendimento', value: 20.00 },
  { date: '2025-09-10', ticker: 'KNRI11', type: 'Rendimento', value: 25.50 },
  { date: '2025-09-15', ticker: 'VALE3', type: 'Dividendo', value: 450.00 },
  { date: '2025-09-28', ticker: 'VOO', type: 'Dividendo', value: 39.00 },
  // Outubro 2025
  { date: '2025-10-05', ticker: 'PETR4', type: 'Dividendo', value: 400.00 },
  { date: '2025-10-10', ticker: 'HGLG11', type: 'Rendimento', value: 55.00 },
  { date: '2025-10-10', ticker: 'XPLG11', type: 'Rendimento', value: 54.40 },
  { date: '2025-10-10', ticker: 'MXRF11', type: 'Rendimento', value: 20.00 },
  { date: '2025-10-10', ticker: 'KNRI11', type: 'Rendimento', value: 25.50 },
  { date: '2025-10-20', ticker: 'ITUB4', type: 'JCP', value: 135.00 },
  { date: '2025-10-25', ticker: 'MSFT', type: 'Dividendo', value: 30.00 },
  // Novembro 2025
  { date: '2025-11-05', ticker: 'WEGE3', type: 'Dividendo', value: 58.00 },
  { date: '2025-11-10', ticker: 'HGLG11', type: 'Rendimento', value: 55.00 },
  { date: '2025-11-10', ticker: 'XPLG11', type: 'Rendimento', value: 54.40 },
  { date: '2025-11-10', ticker: 'MXRF11', type: 'Rendimento', value: 20.00 },
  { date: '2025-11-10', ticker: 'KNRI11', type: 'Rendimento', value: 25.50 },
  { date: '2025-11-15', ticker: 'BBAS3', type: 'JCP', value: 280.00 },
  { date: '2025-11-20', ticker: 'ABEV3', type: 'Dividendo', value: 96.00 },
  { date: '2025-11-28', ticker: 'AAPL', type: 'Dividendo', value: 22.50 },
  // Dezembro 2025
  { date: '2025-12-05', ticker: 'PETR4', type: 'Dividendo', value: 420.00 },
  { date: '2025-12-10', ticker: 'HGLG11', type: 'Rendimento', value: 56.00 },
  { date: '2025-12-10', ticker: 'XPLG11', type: 'Rendimento', value: 55.00 },
  { date: '2025-12-10', ticker: 'MXRF11', type: 'Rendimento', value: 20.00 },
  { date: '2025-12-10', ticker: 'KNRI11', type: 'Rendimento', value: 26.00 },
  { date: '2025-12-15', ticker: 'VALE3', type: 'Dividendo', value: 480.00 },
  { date: '2025-12-20', ticker: 'SUZB3', type: 'Dividendo', value: 42.00 },
  { date: '2025-12-28', ticker: 'VOO', type: 'Dividendo', value: 41.00 },
  // Janeiro 2026
  { date: '2026-01-05', ticker: 'ITUB4', type: 'JCP', value: 140.00 },
  { date: '2026-01-10', ticker: 'HGLG11', type: 'Rendimento', value: 56.00 },
  { date: '2026-01-10', ticker: 'XPLG11', type: 'Rendimento', value: 55.00 },
  { date: '2026-01-10', ticker: 'MXRF11', type: 'Rendimento', value: 20.50 },
  { date: '2026-01-10', ticker: 'KNRI11', type: 'Rendimento', value: 26.00 },
  { date: '2026-01-15', ticker: 'BBAS3', type: 'Dividendo', value: 310.00 },
  { date: '2026-01-20', ticker: 'RENT3', type: 'Dividendo', value: 32.00 },
  { date: '2026-01-25', ticker: 'MSFT', type: 'Dividendo', value: 30.00 },
];

// --------------------------------------------------------
// Watchlist
// --------------------------------------------------------
export const watchlistData = [
  {
    ticker: 'TAEE11', name: 'Taesa UNT', currentPrice: 36.50,
    fairPrice: 42.00, targetPrice: 33.00, status: 'Interesse',
    sector: 'Energia Elétrica',
  },
  {
    ticker: 'EGIE3', name: 'Engie Brasil ON', currentPrice: 43.80,
    fairPrice: 48.00, targetPrice: 40.00, status: 'Interesse',
    sector: 'Energia Elétrica',
  },
  {
    ticker: 'PETR4', name: 'Petrobras PN', currentPrice: 37.80,
    fairPrice: 42.70, targetPrice: 35.00, status: 'Possui',
    sector: 'Petróleo e Gás',
  },
  {
    ticker: 'FLRY3', name: 'Fleury ON', currentPrice: 15.20,
    fairPrice: 19.50, targetPrice: 14.50, status: 'Interesse',
    sector: 'Saúde',
  },
];

// --------------------------------------------------------
// Metas de Alocação (% do patrimônio financeiro)
// --------------------------------------------------------
export const allocationTargets = [
  { class: 'RV Brasil', target: 30, icon: 'TrendingUp' },
  { class: 'FIIs', target: 15, icon: 'Building2' },
  { class: 'RV Exterior', target: 20, icon: 'Globe' },
  { class: 'Renda Fixa', target: 25, icon: 'Shield' },
  { class: 'Cripto', target: 5, icon: 'Bitcoin' },
  { class: 'Reserva Emergência', target: 5, icon: 'Wallet' },
];

// --------------------------------------------------------
// Histórico Patrimonial (para gráfico de evolução)
// --------------------------------------------------------
export const patrimonialHistory = [
  { month: 'Ago/25', total: 485000, cdi: 100, ibov: 100, ipca6: 100, sp500: 100 },
  { month: 'Set/25', total: 498000, cdi: 100.9, ibov: 102.1, ipca6: 100.8, sp500: 101.5 },
  { month: 'Out/25', total: 510000, cdi: 101.8, ibov: 99.5, ipca6: 101.6, sp500: 103.2 },
  { month: 'Nov/25', total: 522000, cdi: 102.7, ibov: 101.8, ipca6: 102.4, sp500: 105.1 },
  { month: 'Dez/25', total: 535000, cdi: 103.6, ibov: 104.2, ipca6: 103.2, sp500: 104.8 },
  { month: 'Jan/26', total: 548000, cdi: 104.5, ibov: 103.5, ipca6: 104.0, sp500: 106.5 },
];

// Benchmarks - rentabilidade acumulada no período
export const benchmarks = {
  cdi: { month: 0.87, ytd: 0.87, year: 10.75, sinceStart: 4.5 },
  ibov: { month: -0.68, ytd: -0.68, year: 3.5, sinceStart: 3.5 },
  ipca6: { month: 0.78, ytd: 0.78, year: 10.2, sinceStart: 4.0 },
  sp500: { month: 1.62, ytd: 1.62, year: 18.5, sinceStart: 6.5 },
};

// --------------------------------------------------------
// Histórico de Acumulação de Cotas (últimos 6 meses)
// --------------------------------------------------------
export const accumulationHistory = [
  { month: 'Ago/25', totalShares: 1650, brShares: 1340, fiiShares: 310 },
  { month: 'Set/25', totalShares: 1700, brShares: 1380, fiiShares: 320 },
  { month: 'Out/25', totalShares: 1750, brShares: 1410, fiiShares: 340 },
  { month: 'Nov/25', totalShares: 1810, brShares: 1460, fiiShares: 350 },
  { month: 'Dez/25', totalShares: 1860, brShares: 1500, fiiShares: 360 },
  { month: 'Jan/26', totalShares: 1900, brShares: 1540, fiiShares: 360 },
];

// --------------------------------------------------------
// Metas de Acumulação (Filosofia Barsi)
// --------------------------------------------------------
export const accumulationGoals = [
  { id: 'goal-1', ticker: 'ITUB4', targetQty: 500, note: 'Acumular banco perene' },
  { id: 'goal-2', ticker: 'BBAS3', targetQty: 400, note: 'Pilar de dividendos bancarios' },
  { id: 'goal-3', ticker: 'HGLG11', targetQty: 100, note: 'Renda passiva com logistica' },
  { id: 'goal-4', ticker: 'PETR4', targetQty: 300, note: 'Dividendos extraordinarios' },
];

// --------------------------------------------------------
// Setores Perenes (Filosofia Barsi)
// --------------------------------------------------------
export const PERENNIAL_SECTORS = ['Bancos', 'Energia Eletrica', 'Saneamento', 'Seguros'];

// --------------------------------------------------------
// Cores para gráficos
// --------------------------------------------------------
export const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#22d3ee', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
  '#f97316', '#a78bfa',
];

export const SECTOR_COLORS = {
  'Petróleo e Gás': '#f97316',
  'Mineração': '#a78bfa',
  'Bancos': '#6366f1',
  'Bens Industriais': '#22d3ee',
  'Bebidas': '#f59e0b',
  'Locação de Veículos': '#ec4899',
  'Papel e Celulose': '#10b981',
  'Logística': '#8b5cf6',
  'Papel (CRI)': '#14b8a6',
  'Híbrido': '#ef4444',
  'Technology': '#6366f1',
  'Index Fund': '#22d3ee',
  'Real Estate': '#f59e0b',
  'Energia Elétrica': '#10b981',
  'Saúde': '#ec4899',
};
