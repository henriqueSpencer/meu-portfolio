import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toSnakeCase } from '../../utils/apiHelpers';
import { useHistoricalRates } from '../../hooks/useMarketData';
import {
  formatBRL,
  formatCurrency,
  formatPct,
  formatDate,
  colorClass,
} from '../../utils/formatters';
import {
  calculateFixedIncomeSummary,
  buildQuotaHistory,
  buildBenchmarkSeries,
  buildBondReturnSeries,
  getEarliestDate,
  isoToBcb,
  todayBcb,
  generateRateText,
  isDefaultTaxExempt,
  getIndexerDistribution,
} from '../../utils/fixedIncomeCalculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts';
import {
  Shield,
  Calendar,
  TrendingUp,
  Plus,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Loader2,
  AlertCircle,
  Wallet,
  BarChart3,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CHART_COLORS } from '../../data/mockData';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

// -------------------------------------------------------
// Color mappings
// -------------------------------------------------------
const TYPE_COLORS = {
  'Tesouro Direto': CHART_COLORS[0],
  CDB: CHART_COLORS[1],
  LCI: CHART_COLORS[3],
  LCA: CHART_COLORS[2],
  Debenture: CHART_COLORS[4],
  CRI: CHART_COLORS[7],
  CRA: CHART_COLORS[5],
};

const INDEXER_COLORS = {
  CDI: CHART_COLORS[0],
  IPCA: CHART_COLORS[3],
  Selic: CHART_COLORS[2],
  Prefixado: CHART_COLORS[4],
  Outros: CHART_COLORS[8],
};

const BENCHMARK_COLORS = {
  portfolio: '#8b5cf6',
  cdi: '#6366f1',
  ipca: '#10b981',
  ipca6: '#22d3ee',
  selic: '#f59e0b',
  poupanca: '#94a3b8',
};

const INDIVIDUAL_BOND_COLORS = [
  '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24',
  '#60a5fa', '#f87171', '#4ade80', '#c084fc', '#38bdf8',
];

const CASH_TYPE_LABELS = {
  conta_corrente: 'Conta Corrente',
  poupanca: 'Poupanca',
  especie: 'Especie',
  cartao_credito: 'Cartao de Credito',
};

const CASH_TYPE_COLORS = {
  conta_corrente: 'bg-indigo-500/20 text-indigo-400',
  poupanca: 'bg-emerald-500/20 text-emerald-400',
  especie: 'bg-amber-500/20 text-amber-400',
  cartao_credito: 'bg-red-500/20 text-red-400',
};

function getTypeColor(type) {
  return TYPE_COLORS[type] || CHART_COLORS[8];
}

// -------------------------------------------------------
// Period filter options for benchmark chart
// -------------------------------------------------------
const PERIOD_OPTIONS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1A', months: 12 },
  { label: '2A', months: 24 },
  { label: 'Tudo', months: null },
];

// -------------------------------------------------------
// Status badge component
// -------------------------------------------------------
function StatusBadge({ status }) {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    slate: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[status.color] || colors.slate}`}>
      {status.label}
    </span>
  );
}

// -------------------------------------------------------
// Custom tooltips
// -------------------------------------------------------
function MaturityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-slate-200 font-medium mb-1">{d.title}</p>
      <p className="text-slate-400">
        Tipo: <span className="text-slate-300">{d.type}</span>
      </p>
      <p className="text-slate-400">
        Vencimento: <span className="text-slate-300">{formatDate(d.maturityDate)}</span>
      </p>
      <p className="text-slate-400">
        Prazo restante:{' '}
        <span className="text-slate-300">
          {d.months < 12
            ? `${d.months} ${d.months === 1 ? 'mes' : 'meses'}`
            : `${(d.months / 12).toFixed(1)} anos`}
        </span>
      </p>
    </div>
  );
}

function BenchmarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {formatPct(entry.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-slate-200 font-medium">{d.name}</p>
      <p className="text-slate-400">{formatBRL(d.value)}</p>
    </div>
  );
}

// -------------------------------------------------------
// CRUD defaults
// -------------------------------------------------------
const EMPTY_BOND = {
  title: '',
  type: 'Tesouro Direto',
  rate: '',
  appliedValue: '',
  applicationDate: '',
  maturityDate: '',
  broker: '',
  indexer: 'CDI',
  contractedRate: '',
  taxExempt: false,
};

const EMPTY_ETF = {
  ticker: '',
  name: '',
  qty: '',
  avgPrice: '',
  currentPrice: '',
  broker: '',
};

const EMPTY_CASH = {
  name: '',
  type: 'conta_corrente',
  institution: '',
  balance: '',
  currency: 'BRL',
};

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
export default function FixedIncomeTab() {
  const {
    fixedIncome, setFixedIncome,
    fiEtfs, setFiEtfs,
    cashAccounts, setCashAccounts,
    currency, exchangeRate,
    createTransaction, fixedIncomeCrud, fiEtfsCrud, cashAccountsCrud,
  } = useApp();
  const [sortField, setSortField] = useState('maturityDate');
  const [sortAsc, setSortAsc] = useState(true);

  // Bond CRUD state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_BOND);

  // ETF CRUD state
  const [etfModalOpen, setEtfModalOpen] = useState(false);
  const [editingEtf, setEditingEtf] = useState(null);
  const [etfForm, setEtfForm] = useState(EMPTY_ETF);

  // Cash CRUD state
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [editingCash, setEditingCash] = useState(null);
  const [cashForm, setCashForm] = useState(EMPTY_CASH);

  // Benchmark chart state
  const [benchmarkPeriod, setBenchmarkPeriod] = useState('Tudo');
  const [visibleLines, setVisibleLines] = useState(
    new Set(['portfolio', 'cdi', 'ipca', 'ipca6', 'selic'])
  );
  const [excludedBondIds, setExcludedBondIds] = useState(new Set());
  const [showIndividualBonds, setShowIndividualBonds] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  // ---- Fetch BCB historical data ----
  const earliestDate = useMemo(() => getEarliestDate(fixedIncome), [fixedIncome]);
  const startBcb = useMemo(() => (earliestDate ? isoToBcb(earliestDate) : ''), [earliestDate]);
  const endBcb = useMemo(() => todayBcb(), []);

  const {
    data: historicalData,
    isLoading: histLoading,
    isError: histError,
  } = useHistoricalRates([12, 433, 11], startBcb, endBcb);

  // ---- Bond calculations ----
  const { bonds: enrichedBonds, totals } = useMemo(
    () => calculateFixedIncomeSummary(fixedIncome, historicalData),
    [fixedIncome, historicalData]
  );

  // ---- Bonds selected for portfolio composition ----
  const selectedBonds = useMemo(
    () => fixedIncome.filter((b) => !excludedBondIds.has(b.id)),
    [fixedIncome, excludedBondIds]
  );

  const quotaHistory = useMemo(
    () => buildQuotaHistory(selectedBonds, historicalData),
    [selectedBonds, historicalData]
  );

  // ---- Individual bond return series for chart ----
  const individualBondSeries = useMemo(() => {
    if (!showIndividualBonds || !historicalData) return {};
    const result = {};
    for (const bond of enrichedBonds) {
      if (excludedBondIds.has(bond.id)) continue;
      result[bond.id] = buildBondReturnSeries(bond, historicalData);
    }
    return result;
  }, [enrichedBonds, excludedBondIds, showIndividualBonds, historicalData]);

  const benchmarkSeries = useMemo(
    () => (earliestDate ? buildBenchmarkSeries(earliestDate, historicalData) : {}),
    [earliestDate, historicalData]
  );

  // ---- Indexer distribution for pie chart ----
  const indexerDist = useMemo(
    () => getIndexerDistribution(enrichedBonds),
    [enrichedBonds]
  );

  // ---- ETF totals ----
  const etfTotals = useMemo(() => {
    const totalInvested = fiEtfs.reduce((sum, e) => sum + e.qty * (e.avgPrice || 0), 0);
    const totalCurrent = fiEtfs.reduce((sum, e) => sum + e.qty * (e.currentPrice || 0), 0);
    const returnValue = totalCurrent - totalInvested;
    const returnPct = totalInvested > 0 ? (returnValue / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, returnValue, returnPct };
  }, [fiEtfs]);

  // ---- Cash totals ----
  const cashTotals = useMemo(() => {
    const positive = cashAccounts
      .filter((a) => a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0);
    const negative = cashAccounts
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + a.balance, 0);
    const net = positive + negative;
    return { positive, negative, net };
  }, [cashAccounts]);

  // ---- Combined RF total for summary ----
  const combinedRfTotal = totals.totalGross + etfTotals.totalCurrent;

  // ---- Benchmark chart data (merged series) ----
  const benchmarkChartData = useMemo(() => {
    const hasAnyBenchmark = ['cdi', 'ipca', 'ipca6', 'selic', 'poupanca'].some(
      (key) => benchmarkSeries[key]?.length > 0
    );
    if (!quotaHistory.length && !hasAnyBenchmark) return [];

    // Determine start date based on period filter
    const option = PERIOD_OPTIONS.find((p) => p.label === benchmarkPeriod);
    let filterDate = null;
    if (option?.months) {
      filterDate = new Date();
      filterDate.setMonth(filterDate.getMonth() - option.months);
    }

    // Build a date-keyed map from all series
    const dateMap = new Map();

    function addSeries(series, key) {
      if (!series) return;
      for (const entry of series) {
        const date = entry.date;
        if (filterDate) {
          const d = new Date(date + 'T00:00:00');
          if (d < filterDate) continue;
        }
        if (!dateMap.has(date)) dateMap.set(date, { date });
        dateMap.get(date)[key] = entry.value;
      }
    }

    // Portfolio return from quota history
    if (quotaHistory.length) {
      const baseQuota = quotaHistory[0].quotaValue;
      const portfolioSeries = quotaHistory.map((q) => ({
        date: q.date,
        value: ((q.quotaValue / baseQuota) - 1) * 100,
      }));
      addSeries(portfolioSeries, 'portfolio');
    }

    addSeries(benchmarkSeries.cdi, 'cdi');
    addSeries(benchmarkSeries.ipca, 'ipca');
    addSeries(benchmarkSeries.ipca6, 'ipca6');
    addSeries(benchmarkSeries.selic, 'selic');
    addSeries(benchmarkSeries.poupanca, 'poupanca');

    // Add individual bond series
    const bondKeys = [];
    if (showIndividualBonds) {
      for (const [bondId, series] of Object.entries(individualBondSeries)) {
        const key = `bond_${bondId}`;
        bondKeys.push(key);
        addSeries(series, key);
      }
    }

    // Sort by date
    const sorted = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (sorted.length === 0) return [];

    const keys = ['portfolio', 'cdi', 'ipca', 'ipca6', 'selic', 'poupanca', ...bondKeys];

    // Find a common start date so all series begin at the same point.
    // Use portfolio's first date as anchor (chart's purpose is comparing against it).
    // Fallback: latest first-date among all series.
    let commonStartDate = null;
    for (const entry of sorted) {
      if (entry.portfolio != null) {
        commonStartDate = entry.date;
        break;
      }
    }
    if (!commonStartDate) {
      for (const key of keys) {
        for (const entry of sorted) {
          if (entry[key] != null) {
            if (!commonStartDate || entry.date > commonStartDate) {
              commonStartDate = entry.date;
            }
            break;
          }
        }
      }
    }

    // Trim entries before common start date
    const trimmed = commonStartDate
      ? sorted.filter((e) => e.date >= commonStartDate)
      : sorted;

    if (trimmed.length === 0) return [];

    // Find base value per key at common start
    const baseValues = {};
    for (const key of keys) {
      for (const entry of trimmed) {
        if (entry[key] != null) {
          baseValues[key] = entry[key];
          break;
        }
      }
    }

    // Normalize using compound return: ((1+val/100)/(1+base/100) - 1) * 100
    // Then forward-fill sparse series (e.g. monthly IPCA) so tooltip shows all lines
    const lastSeen = {};
    return trimmed.map((entry) => {
      const normalized = { date: entry.date };
      for (const key of keys) {
        if (entry[key] != null && baseValues[key] != null) {
          const entryFactor = 1 + entry[key] / 100;
          const baseFactor = 1 + baseValues[key] / 100;
          normalized[key] = (entryFactor / baseFactor - 1) * 100;
          lastSeen[key] = normalized[key];
        } else if (lastSeen[key] != null) {
          normalized[key] = lastSeen[key];
        }
      }
      return normalized;
    });
  }, [quotaHistory, benchmarkSeries, benchmarkPeriod, showIndividualBonds, individualBondSeries]);

  // ---- Sorted table data ----
  const sortedBonds = useMemo(() => {
    const copy = [...enrichedBonds];
    copy.sort((a, b) => {
      let va, vb;
      if (sortField === 'returnPct' || sortField === 'netReturnPct') {
        va = a[sortField] || 0;
        vb = b[sortField] || 0;
      } else if (['appliedValue', 'grossValue', 'netValue'].includes(sortField)) {
        va = a[sortField] || 0;
        vb = b[sortField] || 0;
      } else if (['applicationDate', 'maturityDate'].includes(sortField)) {
        va = new Date(a[sortField] + 'T00:00:00').getTime();
        vb = new Date(b[sortField] + 'T00:00:00').getTime();
      } else {
        va = (a[sortField] || '').toString().toLowerCase();
        vb = (b[sortField] || '').toString().toLowerCase();
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [enrichedBonds, sortField, sortAsc]);

  // ---- Maturity timeline chart data ----
  const maturityData = useMemo(() => {
    const now = new Date();
    return enrichedBonds
      .map((b) => {
        const maturity = new Date(b.maturityDate + 'T00:00:00');
        const diffMs = maturity.getTime() - now.getTime();
        const months = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44)), 0);
        return {
          title: b.title,
          type: b.type,
          months,
          maturityDate: b.maturityDate,
          appliedValue: b.appliedValue,
        };
      })
      .sort((a, b) => a.months - b.months);
  }, [enrichedBonds]);

  // ---- Sort handler ----
  function handleSort(field) {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function sortIndicator(field) {
    if (sortField !== field) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  }

  // ---- Bond CRUD handlers ----
  function handleAdd() {
    setEditing(null);
    setForm(EMPTY_BOND);
    setModalOpen(true);
  }

  function handleEdit(bond) {
    setEditing(bond);
    setForm({
      title: bond.title,
      type: bond.type,
      rate: bond.rate,
      appliedValue: String(bond.appliedValue),
      applicationDate: bond.applicationDate || '',
      maturityDate: bond.maturityDate || '',
      broker: bond.broker || '',
      indexer: bond.indexer || 'CDI',
      contractedRate: String(bond.contractedRate || ''),
      taxExempt: bond.taxExempt || false,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const contractedRate = Number(form.contractedRate) || 0;
    const parsed = {
      id: editing ? editing.id : String(Date.now()),
      title: form.title.trim(),
      type: form.type,
      rate: form.rate.trim() || generateRateText(form.indexer, contractedRate),
      appliedValue: Number(form.appliedValue) || 0,
      currentValue: 0,
      applicationDate: form.applicationDate,
      maturityDate: form.maturityDate,
      broker: form.broker.trim(),
      indexer: form.indexer,
      contractedRate,
      taxExempt: form.taxExempt,
    };
    if (!parsed.title) return;
    const today = new Date().toISOString().slice(0, 10);
    if (editing) {
      const oldApplied = editing.appliedValue || 0;
      const newApplied = parsed.appliedValue;
      const delta = newApplied - oldApplied;
      // Preserve currentValue from existing
      parsed.currentValue = editing.currentValue || 0;
      setFixedIncome((prev) => prev.map((b) => (b.id === editing.id ? parsed : b)));
      if (delta !== 0) {
        await createTransaction({
          date: today,
          operationType: delta > 0 ? 'aporte' : 'resgate',
          assetClass: 'fixed_income',
          assetId: parsed.id,
          assetName: parsed.title,
          totalValue: Math.abs(delta),
          broker: parsed.broker,
          notes: 'Ajuste via aba Renda Fixa',
        });
      }
    } else {
      const assetData = { ...parsed, appliedValue: 0, currentValue: 0 };
      await fixedIncomeCrud.create.mutateAsync(toSnakeCase(assetData, 'fixedIncome'));
      if (parsed.appliedValue > 0) {
        await createTransaction({
          date: parsed.applicationDate || today,
          operationType: 'aporte',
          assetClass: 'fixed_income',
          assetId: parsed.id,
          assetName: parsed.title,
          totalValue: parsed.appliedValue,
          broker: parsed.broker,
          notes: 'Aporte inicial via aba Renda Fixa',
        });
      }
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!editing) return;
    if ((editing.appliedValue || 0) > 0) {
      const today = new Date().toISOString().slice(0, 10);
      await createTransaction({
        date: today,
        operationType: 'resgate',
        assetClass: 'fixed_income',
        assetId: editing.id,
        assetName: editing.title,
        totalValue: editing.currentValue || editing.appliedValue,
        broker: editing.broker,
        notes: 'Encerramento via aba Renda Fixa',
      });
    }
    setFixedIncome((prev) => prev.filter((b) => b.id !== editing.id));
    setModalOpen(false);
  }

  // ---- Handle type change: auto-set tax exempt ----
  function handleTypeChange(newType) {
    setForm((f) => ({
      ...f,
      type: newType,
      taxExempt: isDefaultTaxExempt(newType) ? true : f.taxExempt,
    }));
  }

  // ---- Handle indexer change: auto-update rate text ----
  function handleIndexerChange(newIndexer) {
    setForm((f) => ({
      ...f,
      indexer: newIndexer,
      rate: generateRateText(newIndexer, Number(f.contractedRate) || 0),
    }));
  }

  function handleContractedRateChange(val) {
    setForm((f) => ({
      ...f,
      contractedRate: val,
      rate: generateRateText(f.indexer, Number(val) || 0),
    }));
  }

  // ---- ETF CRUD handlers ----
  function handleAddEtf() {
    setEditingEtf(null);
    setEtfForm(EMPTY_ETF);
    setEtfModalOpen(true);
  }

  function handleEditEtf(etf) {
    setEditingEtf(etf);
    setEtfForm({
      ticker: etf.ticker,
      name: etf.name,
      qty: String(etf.qty),
      avgPrice: String(etf.avgPrice || ''),
      currentPrice: String(etf.currentPrice || ''),
      broker: etf.broker || '',
    });
    setEtfModalOpen(true);
  }

  async function handleSaveEtf() {
    const parsed = {
      ticker: etfForm.ticker.trim().toUpperCase(),
      name: etfForm.name.trim(),
      qty: Number(etfForm.qty) || 0,
      avgPrice: Number(etfForm.avgPrice) || 0,
      currentPrice: Number(etfForm.currentPrice) || 0,
      broker: etfForm.broker.trim(),
    };
    if (!parsed.ticker || !parsed.name) return;
    const today = new Date().toISOString().slice(0, 10);
    if (editingEtf) {
      const oldQty = editingEtf.qty || 0;
      const newQty = parsed.qty;
      const delta = newQty - oldQty;
      setFiEtfs((prev) => prev.map((e) => (e.ticker === editingEtf.ticker ? parsed : e)));
      if (delta !== 0) {
        await createTransaction({
          date: today,
          operationType: delta > 0 ? 'compra' : 'venda',
          assetClass: 'fi_etf',
          ticker: parsed.ticker,
          assetName: parsed.name,
          qty: Math.abs(delta),
          unitPrice: parsed.avgPrice,
          broker: parsed.broker,
          notes: 'Ajuste via aba Renda Fixa',
        });
      }
    } else {
      const assetData = { ...parsed, qty: 0, avgPrice: 0 };
      await fiEtfsCrud.create.mutateAsync(toSnakeCase(assetData, 'fiEtf'));
      if (parsed.qty > 0) {
        await createTransaction({
          date: today,
          operationType: 'compra',
          assetClass: 'fi_etf',
          ticker: parsed.ticker,
          assetName: parsed.name,
          qty: parsed.qty,
          unitPrice: parsed.avgPrice,
          broker: parsed.broker,
          notes: 'Posicao inicial via aba Renda Fixa',
        });
      }
    }
    setEtfModalOpen(false);
  }

  async function handleDeleteEtf() {
    if (!editingEtf) return;
    if ((editingEtf.qty || 0) > 0) {
      const today = new Date().toISOString().slice(0, 10);
      await createTransaction({
        date: today,
        operationType: 'venda',
        assetClass: 'fi_etf',
        ticker: editingEtf.ticker,
        assetName: editingEtf.name,
        qty: editingEtf.qty,
        unitPrice: editingEtf.currentPrice || editingEtf.avgPrice,
        broker: editingEtf.broker,
        notes: 'Encerramento via aba Renda Fixa',
      });
    }
    setFiEtfs((prev) => prev.filter((e) => e.ticker !== editingEtf.ticker));
    setEtfModalOpen(false);
  }

  // ---- Cash CRUD handlers ----
  function handleAddCash() {
    setEditingCash(null);
    setCashForm(EMPTY_CASH);
    setCashModalOpen(true);
  }

  function handleEditCash(account) {
    setEditingCash(account);
    setCashForm({
      name: account.name,
      type: account.type,
      institution: account.institution || '',
      balance: String(account.balance),
      currency: account.currency || 'BRL',
    });
    setCashModalOpen(true);
  }

  async function handleSaveCash() {
    const parsed = {
      id: editingCash ? editingCash.id : String(Date.now()),
      name: cashForm.name.trim(),
      type: cashForm.type,
      institution: cashForm.institution.trim(),
      balance: Number(cashForm.balance) || 0,
      currency: cashForm.currency,
    };
    if (!parsed.name) return;
    const today = new Date().toISOString().slice(0, 10);
    if (editingCash) {
      const oldBalance = editingCash.balance || 0;
      const newBalance = parsed.balance;
      const delta = newBalance - oldBalance;
      setCashAccounts((prev) => prev.map((a) => (a.id === editingCash.id ? parsed : a)));
      if (delta !== 0) {
        await createTransaction({
          date: today,
          operationType: delta > 0 ? 'aporte' : 'resgate',
          assetClass: 'cash_account',
          assetId: parsed.id,
          assetName: parsed.name,
          totalValue: Math.abs(delta),
          broker: parsed.institution,
          notes: 'Ajuste via aba Renda Fixa',
        });
      }
    } else {
      const assetData = { ...parsed, balance: 0 };
      await cashAccountsCrud.create.mutateAsync(toSnakeCase(assetData, 'cashAccount'));
      if (parsed.balance !== 0) {
        await createTransaction({
          date: today,
          operationType: parsed.balance > 0 ? 'aporte' : 'resgate',
          assetClass: 'cash_account',
          assetId: parsed.id,
          assetName: parsed.name,
          totalValue: Math.abs(parsed.balance),
          broker: parsed.institution,
          notes: 'Saldo inicial via aba Renda Fixa',
        });
      }
    }
    setCashModalOpen(false);
  }

  async function handleDeleteCash() {
    if (!editingCash) return;
    if ((editingCash.balance || 0) !== 0) {
      const today = new Date().toISOString().slice(0, 10);
      await createTransaction({
        date: today,
        operationType: editingCash.balance > 0 ? 'resgate' : 'aporte',
        assetClass: 'cash_account',
        assetId: editingCash.id,
        assetName: editingCash.name,
        totalValue: Math.abs(editingCash.balance),
        broker: editingCash.institution,
        notes: 'Encerramento via aba Renda Fixa',
      });
    }
    setCashAccounts((prev) => prev.filter((a) => a.id !== editingCash.id));
    setCashModalOpen(false);
  }

  // ---- Toggle benchmark line visibility ----
  function toggleLine(key) {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ---- Bond selector for portfolio composition ----
  function toggleBondSelection(bondId) {
    setExcludedBondIds((prev) => {
      const next = new Set(prev);
      if (next.has(bondId)) next.delete(bondId);
      else next.add(bondId);
      return next;
    });
  }

  function selectAllBonds() {
    setExcludedBondIds(new Set());
  }

  function selectNoBonds() {
    setExcludedBondIds(new Set(fixedIncome.map((b) => b.id)));
  }

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* ===================== SUMMARY CARDS ===================== */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Resumo - Renda Fixa
          </h2>
          {histLoading && (
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin ml-2" />
          )}
          {histError && (
            <span className="text-xs text-amber-400 ml-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Dados BCB indisponiveis
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Total RF (Titulos + ETFs)
            </p>
            <p className="text-xl font-bold text-slate-100">
              {formatCurrency(combinedRfTotal, currency, exchangeRate)}
            </p>
          </div>

          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Titulos (Bruto)
            </p>
            <p className="text-xl font-bold text-slate-100">
              {formatCurrency(totals.totalGross, currency, exchangeRate)}
            </p>
          </div>

          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              ETFs RF
            </p>
            <p className="text-xl font-bold text-slate-100">
              {formatCurrency(etfTotals.totalCurrent, currency, exchangeRate)}
            </p>
          </div>

          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Retorno Titulos
            </p>
            <p className={`text-xl font-bold ${colorClass(totals.totalGrossReturn)}`}>
              {formatCurrency(totals.totalGrossReturn, currency, exchangeRate)}
            </p>
            <p className={`text-xs mt-0.5 ${colorClass(totals.grossReturnPct)}`}>
              {formatPct(totals.grossReturnPct)}
            </p>
          </div>

          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Retorno ETFs
            </p>
            <p className={`text-xl font-bold ${colorClass(etfTotals.returnValue)}`}>
              {formatCurrency(etfTotals.returnValue, currency, exchangeRate)}
            </p>
            <p className={`text-xs mt-0.5 ${colorClass(etfTotals.returnPct)}`}>
              {formatPct(etfTotals.returnPct)}
            </p>
          </div>

          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Caixa (Liquido)
            </p>
            <p className={`text-xl font-bold ${cashTotals.net >= 0 ? 'text-slate-100' : 'text-red-400'}`}>
              {formatCurrency(cashTotals.net, currency, exchangeRate)}
            </p>
          </div>
        </div>
      </div>

      {/* ============= BENCHMARK COMPARISON + RENTABILITY ============= */}
      <div className="glass-card p-6">
        {/* Header: title + period filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-slate-200">
              Comparacao com Benchmarks
            </h2>
            {histLoading && (
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin ml-2" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setBenchmarkPeriod(opt.label)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                  benchmarkPeriod === opt.label
                    ? 'bg-indigo-600/30 text-indigo-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Methodology explanation (collapsible) */}
        <div className="mb-4">
          <button
            onClick={() => setShowMethodology((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Como e calculada a rentabilidade?</span>
            {showMethodology ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showMethodology && (
            <div className="mt-3 rounded-lg bg-white/5 border border-white/10 px-4 py-3 space-y-2 text-xs text-slate-400">
              <p>
                <span className="text-slate-300 font-medium">Portfolio RF:</span>{' '}
                Calculado pelo sistema de cotas. Cada titulo recebe cotas proporcionais ao valor
                investido no momento da aplicacao. Novos aportes geram cotas ao preco corrente da cota,
                eliminando a distorcao causada por entradas de capital. O valor da cota evolui
                diariamente com base nas taxas CDI do Banco Central (serie 12).
              </p>
              <p>
                <span className="text-slate-300 font-medium">CDI:</span>{' '}
                Acumulado diario da taxa CDI (serie BCB 12). Representa o retorno de 100% do CDI.
              </p>
              <p>
                <span className="text-slate-300 font-medium">IPCA:</span>{' '}
                Acumulado mensal do indice IPCA (serie BCB 433).
              </p>
              <p>
                <span className="text-slate-300 font-medium">IPCA+6%:</span>{' '}
                IPCA acumulado multiplicado pelo fator de spread de 6% a.a. (252 dias uteis).
              </p>
              <p>
                <span className="text-slate-300 font-medium">Selic:</span>{' '}
                Acumulado diario da taxa Selic (serie BCB 11).
              </p>
              <p>
                <span className="text-slate-300 font-medium">Poupanca:</span>{' '}
                Regra simplificada: 70% da Selic (valida para Selic {'>'} 8,5% a.a.).
              </p>
              <div className="border-t border-white/10 pt-2 mt-2">
                <p className="text-slate-500">
                  Valores individuais dos titulos sao calculados conforme o indexador:
                  CDI e Selic aplicam a taxa diaria com o percentual contratado;
                  IPCA acumula mensalmente e aplica o spread diario em dias uteis;
                  Prefixado compoe a taxa fixa contratada sobre dias uteis (base 252).
                  O IR segue a tabela regressiva (22,5% ate 180d; 20% ate 360d; 17,5% ate 720d; 15% acima).
                  Titulos LCI, LCA, CRI e CRA sao isentos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bond selector for portfolio composition */}
        {enrichedBonds.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Titulos na composicao
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllBonds}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 transition"
                >
                  Todos
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={selectNoBonds}
                  className="text-[10px] text-slate-500 hover:text-slate-400 transition"
                >
                  Nenhum
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {enrichedBonds.map((bond, idx) => {
                const isSelected = !excludedBondIds.has(bond.id);
                const bondColor = INDIVIDUAL_BOND_COLORS[idx % INDIVIDUAL_BOND_COLORS.length];
                return (
                  <button
                    key={bond.id}
                    onClick={() => toggleBondSelection(bond.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition border ${
                      isSelected
                        ? 'bg-white/[0.06] border-white/15 text-slate-200'
                        : 'bg-transparent border-white/5 text-slate-600'
                    }`}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor: bondColor,
                        opacity: isSelected ? 1 : 0.25,
                      }}
                    />
                    <span className="whitespace-nowrap">{bond.title}</span>
                    <span
                      className="inline-block text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${INDEXER_COLORS[bond.indexer] || INDEXER_COLORS.Outros}15`,
                        color: isSelected
                          ? (INDEXER_COLORS[bond.indexer] || INDEXER_COLORS.Outros)
                          : 'currentColor',
                      }}
                    >
                      {bond.indexer}
                    </span>
                    <span className={`text-[10px] ${isSelected ? colorClass(bond.returnPct) : ''}`}>
                      {formatPct(bond.returnPct)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clickable legend + individual toggle */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {[
            { key: 'portfolio', label: 'Portfolio RF' },
            { key: 'cdi', label: 'CDI' },
            { key: 'ipca', label: 'IPCA' },
            { key: 'ipca6', label: 'IPCA+6%' },
            { key: 'selic', label: 'Selic' },
            { key: 'poupanca', label: 'Poupanca' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center gap-1.5 text-xs transition ${
                visibleLines.has(key) ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: BENCHMARK_COLORS[key],
                  opacity: visibleLines.has(key) ? 1 : 0.3,
                }}
              />
              {label}
            </button>
          ))}

          <span className="border-l border-white/10 h-4" />

          <button
            onClick={() => setShowIndividualBonds((v) => !v)}
            className={`flex items-center gap-1.5 text-xs transition ${
              showIndividualBonds ? 'text-violet-300' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {showIndividualBonds ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            Individual
          </button>
        </div>

        {/* Chart */}
        {histLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando dados BCB...
          </div>
        ) : histError ? (
          <div className="flex items-center justify-center h-64 text-amber-400 text-sm">
            <AlertCircle className="w-5 h-5 mr-2" />
            Nao foi possivel carregar dados historicos do BCB. Tente novamente mais tarde.
          </div>
        ) : benchmarkChartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={benchmarkChartData}
                margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tickFormatter={(d) => {
                    const parts = d.split('-');
                    return `${parts[1]}/${parts[0].slice(2)}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={60}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                />
                <Tooltip content={<BenchmarkTooltip />} />
                {visibleLines.has('portfolio') && (
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    name="Portfolio RF"
                    stroke={BENCHMARK_COLORS.portfolio}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                )}
                {visibleLines.has('cdi') && (
                  <Line
                    type="monotone"
                    dataKey="cdi"
                    name="CDI"
                    stroke={BENCHMARK_COLORS.cdi}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    strokeDasharray="4 2"
                  />
                )}
                {visibleLines.has('ipca') && (
                  <Line
                    type="monotone"
                    dataKey="ipca"
                    name="IPCA"
                    stroke={BENCHMARK_COLORS.ipca}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    strokeDasharray="4 2"
                  />
                )}
                {visibleLines.has('ipca6') && (
                  <Line
                    type="monotone"
                    dataKey="ipca6"
                    name="IPCA+6%"
                    stroke={BENCHMARK_COLORS.ipca6}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    strokeDasharray="4 2"
                  />
                )}
                {visibleLines.has('selic') && (
                  <Line
                    type="monotone"
                    dataKey="selic"
                    name="Selic"
                    stroke={BENCHMARK_COLORS.selic}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    strokeDasharray="4 2"
                  />
                )}
                {visibleLines.has('poupanca') && (
                  <Line
                    type="monotone"
                    dataKey="poupanca"
                    name="Poupanca"
                    stroke={BENCHMARK_COLORS.poupanca}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    strokeDasharray="4 2"
                  />
                )}
                {/* Individual bond lines */}
                {showIndividualBonds &&
                  enrichedBonds
                    .filter((b) => !excludedBondIds.has(b.id))
                    .map((bond, idx) => (
                      <Line
                        key={bond.id}
                        type="monotone"
                        dataKey={`bond_${bond.id}`}
                        name={bond.title}
                        stroke={INDIVIDUAL_BOND_COLORS[idx % INDIVIDUAL_BOND_COLORS.length]}
                        strokeWidth={1.5}
                        dot={false}
                        connectNulls
                      />
                    ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
            Sem dados suficientes para exibir o grafico
          </div>
        )}

        {/* Individual bond performance details */}
        {enrichedBonds.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              Detalhamento por Titulo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-2 text-left text-slate-500 font-medium uppercase tracking-wider" />
                    <th className="py-2 px-2 text-left text-slate-500 font-medium uppercase tracking-wider">Titulo</th>
                    <th className="py-2 px-2 text-left text-slate-500 font-medium uppercase tracking-wider">Indexador</th>
                    <th className="py-2 px-2 text-left text-slate-500 font-medium uppercase tracking-wider">Taxa</th>
                    <th className="py-2 px-2 text-left text-slate-500 font-medium uppercase tracking-wider">Aplicacao</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">Aplicado</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">Bruto</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">Liquido</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">Ret Bruto</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">Ret Liq</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">IR</th>
                    <th className="py-2 px-2 text-right text-slate-500 font-medium uppercase tracking-wider">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedBonds.map((bond, idx) => {
                    const isSelected = !excludedBondIds.has(bond.id);
                    const weight = totals.totalApplied > 0
                      ? (bond.appliedValue / totals.totalApplied) * 100
                      : 0;
                    return (
                      <tr
                        key={bond.id}
                        className={`border-b border-white/5 transition-colors ${
                          isSelected ? 'hover:bg-white/[0.03]' : 'opacity-40'
                        }`}
                      >
                        <td className="py-2 px-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-sm"
                            style={{
                              backgroundColor: INDIVIDUAL_BOND_COLORS[idx % INDIVIDUAL_BOND_COLORS.length],
                              opacity: isSelected ? 1 : 0.3,
                            }}
                          />
                        </td>
                        <td className="py-2 px-2 text-slate-200 font-medium whitespace-nowrap">
                          {bond.title}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${INDEXER_COLORS[bond.indexer] || INDEXER_COLORS.Outros}20`,
                              color: INDEXER_COLORS[bond.indexer] || INDEXER_COLORS.Outros,
                            }}
                          >
                            {bond.indexer}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{bond.rate}</td>
                        <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                          {formatDate(bond.applicationDate)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 whitespace-nowrap">
                          {formatCurrency(bond.appliedValue, currency, exchangeRate)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-200 whitespace-nowrap">
                          {formatCurrency(bond.grossValue, currency, exchangeRate)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-200 whitespace-nowrap">
                          {formatCurrency(bond.netValue, currency, exchangeRate)}
                          {bond.taxExempt && (
                            <span className="ml-0.5 text-[9px] text-emerald-400">isento</span>
                          )}
                        </td>
                        <td className={`py-2 px-2 text-right font-semibold whitespace-nowrap ${colorClass(bond.returnPct)}`}>
                          {formatPct(bond.returnPct)}
                        </td>
                        <td className={`py-2 px-2 text-right whitespace-nowrap ${colorClass(bond.netReturnPct)}`}>
                          {formatPct(bond.netReturnPct)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-500 whitespace-nowrap">
                          {bond.taxExempt ? '-' : `${(bond.irRate * 100).toFixed(1)}%`}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 whitespace-nowrap">
                          {formatPct(weight)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===================== SECTION 1: TITULOS DE RENDA FIXA ===================== */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Titulos de Renda Fixa
          </h2>
          <button
            onClick={handleAdd}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Titulo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  { key: 'title', label: 'Titulo' },
                  { key: 'type', label: 'Tipo' },
                  { key: 'indexer', label: 'Indexador' },
                  { key: 'rate', label: 'Taxa' },
                  { key: 'applicationDate', label: 'Aplicacao' },
                  { key: 'maturityDate', label: 'Vencimento' },
                  { key: 'appliedValue', label: 'Valor Aplicado', align: 'right' },
                  { key: 'grossValue', label: 'Valor Bruto', align: 'right' },
                  { key: 'netValue', label: 'Valor Liquido', align: 'right' },
                  { key: 'returnPct', label: 'Retorno %', align: 'right' },
                  { key: 'status', label: 'Status', align: 'center' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'status' && handleSort(col.key)}
                    className={`py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 select-none whitespace-nowrap ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.label}
                    {col.key !== 'status' && sortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedBonds.map((bond) => (
                <tr
                  key={bond.id}
                  onClick={() => handleEdit(bond)}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3 text-slate-200 font-medium whitespace-nowrap">
                    {bond.title}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${getTypeColor(bond.type)}20`,
                        color: getTypeColor(bond.type),
                      }}
                    >
                      {bond.type}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${INDEXER_COLORS[bond.indexer] || INDEXER_COLORS.Outros}20`,
                        color: INDEXER_COLORS[bond.indexer] || INDEXER_COLORS.Outros,
                      }}
                    >
                      {bond.indexer}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {bond.rate}
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {formatDate(bond.applicationDate)}
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {formatDate(bond.maturityDate)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap">
                    {formatCurrency(bond.appliedValue, currency, exchangeRate)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200 font-medium whitespace-nowrap">
                    {formatCurrency(bond.grossValue, currency, exchangeRate)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200 whitespace-nowrap">
                    {formatCurrency(bond.netValue, currency, exchangeRate)}
                    {bond.taxExempt && (
                      <span className="ml-1 text-[10px] text-emerald-400">isento</span>
                    )}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${colorClass(bond.returnPct)}`}
                  >
                    {formatPct(bond.returnPct)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={bond.status} />
                  </td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td className="py-3 px-3 text-slate-200 font-bold" colSpan={6}>
                  Total
                </td>
                <td className="py-3 px-3 text-right text-slate-200 font-bold whitespace-nowrap">
                  {formatCurrency(totals.totalApplied, currency, exchangeRate)}
                </td>
                <td className="py-3 px-3 text-right text-slate-100 font-bold whitespace-nowrap">
                  {formatCurrency(totals.totalGross, currency, exchangeRate)}
                </td>
                <td className="py-3 px-3 text-right text-slate-100 font-bold whitespace-nowrap">
                  {formatCurrency(totals.totalNet, currency, exchangeRate)}
                </td>
                <td
                  className={`py-3 px-3 text-right font-bold whitespace-nowrap ${colorClass(totals.grossReturnPct)}`}
                >
                  {formatPct(totals.grossReturnPct)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== SECTION 2: ETFs DE RENDA FIXA ===================== */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            ETFs de Renda Fixa
          </h2>
          <button
            onClick={handleAddEtf}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar ETF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ticker</th>
                <th className="py-3 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="py-3 px-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Qtd</th>
                <th className="py-3 px-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">PM</th>
                <th className="py-3 px-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Preco Atual</th>
                <th className="py-3 px-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Valor Total</th>
                <th className="py-3 px-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Retorno %</th>
                <th className="py-3 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Corretora</th>
              </tr>
            </thead>
            <tbody>
              {fiEtfs.map((etf) => {
                const total = etf.qty * (etf.currentPrice || 0);
                const invested = etf.qty * (etf.avgPrice || 0);
                const ret = invested > 0 ? ((total - invested) / invested) * 100 : 0;
                return (
                  <tr
                    key={etf.ticker}
                    onClick={() => handleEditEtf(etf)}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 text-indigo-400 font-semibold">{etf.ticker}</td>
                    <td className="py-3 px-3 text-slate-200">{etf.name}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{etf.qty}</td>
                    <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap">
                      {formatCurrency(etf.avgPrice, currency, exchangeRate)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200 whitespace-nowrap">
                      {formatCurrency(etf.currentPrice, currency, exchangeRate)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-100 font-medium whitespace-nowrap">
                      {formatCurrency(total, currency, exchangeRate)}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${colorClass(ret)}`}>
                      {formatPct(ret)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{etf.broker}</td>
                  </tr>
                );
              })}

              {fiEtfs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                    Nenhum ETF de renda fixa cadastrado
                  </td>
                </tr>
              )}

              {fiEtfs.length > 0 && (
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td className="py-3 px-3 text-slate-200 font-bold" colSpan={3}>Total</td>
                  <td className="py-3 px-3 text-right text-slate-300 font-bold whitespace-nowrap">
                    {formatCurrency(etfTotals.totalInvested, currency, exchangeRate)}
                  </td>
                  <td />
                  <td className="py-3 px-3 text-right text-slate-100 font-bold whitespace-nowrap">
                    {formatCurrency(etfTotals.totalCurrent, currency, exchangeRate)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${colorClass(etfTotals.returnPct)}`}>
                    {formatPct(etfTotals.returnPct)}
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== SECTION 3: CAIXA E CONTAS ===================== */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Wallet className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Caixa e Contas
          </h2>
          <button
            onClick={handleAddCash}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Conta
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="py-3 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="py-3 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Instituicao</th>
                <th className="py-3 px-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo</th>
                <th className="py-3 px-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Moeda</th>
              </tr>
            </thead>
            <tbody>
              {cashAccounts.map((account) => (
                <tr
                  key={account.id}
                  onClick={() => handleEditCash(account)}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3 text-slate-200 font-medium">{account.name}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CASH_TYPE_COLORS[account.type] || 'bg-slate-500/20 text-slate-400'}`}>
                      {CASH_TYPE_LABELS[account.type] || account.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{account.institution}</td>
                  <td className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${account.balance < 0 ? 'text-red-400' : 'text-slate-100'}`}>
                    {formatCurrency(account.balance, currency, exchangeRate)}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 text-xs">{account.currency}</td>
                </tr>
              ))}

              {cashAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    Nenhuma conta cadastrada
                  </td>
                </tr>
              )}

              {cashAccounts.length > 0 && (
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td className="py-3 px-3 text-slate-200 font-bold" colSpan={3}>Total</td>
                  <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${cashTotals.net < 0 ? 'text-red-400' : 'text-slate-100'}`}>
                    {formatCurrency(cashTotals.net, currency, exchangeRate)}
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============= DISTRIBUTION PIE + MATURITY TIMELINE ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution by Indexer */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-200">
              Distribuicao por Indexador
            </h2>
          </div>

          {indexerDist.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={indexerDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {indexerDist.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={INDEXER_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {indexerDist.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: INDEXER_COLORS[entry.name] || CHART_COLORS[8] }}
                    />
                    {entry.name} ({formatBRL(entry.value)})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">Nenhum titulo cadastrado</p>
          )}
        </div>

        {/* Maturity Timeline */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-200">
              Cronograma de Vencimentos
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            {[...new Set(fixedIncome.map((b) => b.type))].map((type) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getTypeColor(type) }}
                />
                {type}
              </div>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={maturityData}
                layout="vertical"
                margin={{ top: 4, right: 30, bottom: 4, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  label={{
                    value: 'Meses ate o vencimento',
                    position: 'insideBottomRight',
                    offset: -4,
                    fill: '#64748b',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={180}
                />
                <Tooltip
                  content={<MaturityTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="months" radius={[0, 6, 6, 0]} barSize={20}>
                  {maturityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getTypeColor(entry.type)}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-right">
            Referencia: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* ---- Bond CRUD Modal ---- */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${editing.title}` : 'Adicionar Titulo'}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      >
        <FormField label="Titulo">
          <FormInput
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Tesouro IPCA+ 2029"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo">
            <FormSelect value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
              {['Tesouro Direto', 'CDB', 'LCI', 'LCA', 'Debenture', 'CRI', 'CRA'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Corretora">
            <FormInput
              value={form.broker}
              onChange={(e) => setForm((f) => ({ ...f, broker: e.target.value }))}
              placeholder="BTG"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Indexador">
            <FormSelect value={form.indexer} onChange={(e) => handleIndexerChange(e.target.value)}>
              {['CDI', 'IPCA', 'Selic', 'Prefixado'].map((idx) => (
                <option key={idx} value={idx}>
                  {idx}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Taxa Contratada">
            <FormInput
              type="number"
              step="0.01"
              value={form.contractedRate}
              onChange={(e) => handleContractedRateChange(e.target.value)}
              placeholder={form.indexer === 'CDI' || form.indexer === 'Selic' ? '100' : '6.20'}
            />
          </FormField>
        </div>
        <FormField label="Taxa (texto)">
          <FormInput
            value={form.rate}
            onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            placeholder="IPCA + 6.20%"
          />
        </FormField>
        <FormField label="Valor Aplicado">
          <FormInput
            type="number"
            step="0.01"
            value={form.appliedValue}
            onChange={(e) =>
              setForm((f) => ({ ...f, appliedValue: e.target.value }))
            }
          />
        </FormField>
        {editing && historicalData && (
          <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Valor Atual (calculado via BCB)
            </p>
            <p className="text-sm font-medium text-emerald-400">
              {formatBRL(
                enrichedBonds.find((b) => b.id === editing.id)?.grossValue ??
                  form.appliedValue
              )}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data Aplicacao">
            <FormInput
              type="date"
              value={form.applicationDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, applicationDate: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Data Vencimento">
            <FormInput
              type="date"
              value={form.maturityDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, maturityDate: e.target.value }))
              }
            />
          </FormField>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.taxExempt}
              onChange={(e) =>
                setForm((f) => ({ ...f, taxExempt: e.target.checked }))
              }
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/40"
            />
            <span className="text-sm text-slate-300">Isento de IR</span>
          </label>
          {isDefaultTaxExempt(form.type) && (
            <span className="text-[10px] text-emerald-400">
              ({form.type} e isento por padrao)
            </span>
          )}
        </div>
      </FormModal>

      {/* ---- ETF CRUD Modal ---- */}
      <FormModal
        isOpen={etfModalOpen}
        onClose={() => setEtfModalOpen(false)}
        title={editingEtf ? `Editar ${editingEtf.ticker}` : 'Adicionar ETF de Renda Fixa'}
        onSave={handleSaveEtf}
        onDelete={editingEtf ? handleDeleteEtf : undefined}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ticker">
            <FormInput
              value={etfForm.ticker}
              onChange={(e) => setEtfForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder="IMAB11"
              disabled={!!editingEtf}
            />
          </FormField>
          <FormField label="Corretora">
            <FormInput
              value={etfForm.broker}
              onChange={(e) => setEtfForm((f) => ({ ...f, broker: e.target.value }))}
              placeholder="BTG"
            />
          </FormField>
        </div>
        <FormField label="Nome">
          <FormInput
            value={etfForm.name}
            onChange={(e) => setEtfForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="It Now ID ETF IMA-B"
          />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Quantidade">
            <FormInput
              type="number"
              value={etfForm.qty}
              onChange={(e) => setEtfForm((f) => ({ ...f, qty: e.target.value }))}
            />
          </FormField>
          <FormField label="Preco Medio">
            <FormInput
              type="number"
              step="0.01"
              value={etfForm.avgPrice}
              onChange={(e) => setEtfForm((f) => ({ ...f, avgPrice: e.target.value }))}
            />
          </FormField>
          <FormField label="Preco Atual">
            <FormInput
              type="number"
              step="0.01"
              value={etfForm.currentPrice}
              onChange={(e) => setEtfForm((f) => ({ ...f, currentPrice: e.target.value }))}
            />
          </FormField>
        </div>
      </FormModal>

      {/* ---- Cash CRUD Modal ---- */}
      <FormModal
        isOpen={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        title={editingCash ? `Editar ${editingCash.name}` : 'Adicionar Conta'}
        onSave={handleSaveCash}
        onDelete={editingCash ? handleDeleteCash : undefined}
      >
        <FormField label="Nome">
          <FormInput
            value={cashForm.name}
            onChange={(e) => setCashForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Conta Corrente BTG"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo">
            <FormSelect
              value={cashForm.type}
              onChange={(e) => setCashForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="conta_corrente">Conta Corrente</option>
              <option value="poupanca">Poupanca</option>
              <option value="especie">Especie</option>
              <option value="cartao_credito">Cartao de Credito</option>
            </FormSelect>
          </FormField>
          <FormField label="Instituicao">
            <FormInput
              value={cashForm.institution}
              onChange={(e) => setCashForm((f) => ({ ...f, institution: e.target.value }))}
              placeholder="BTG Pactual"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Saldo">
            <FormInput
              type="number"
              step="0.01"
              value={cashForm.balance}
              onChange={(e) => setCashForm((f) => ({ ...f, balance: e.target.value }))}
            />
          </FormField>
          <FormField label="Moeda">
            <FormSelect
              value={cashForm.currency}
              onChange={(e) => setCashForm((f) => ({ ...f, currency: e.target.value }))}
            >
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </FormSelect>
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
