import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatCurrency,
  formatPctUnsigned,
} from '../../utils/formatters';
import { yieldOnCost } from '../../utils/calculations';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Sprout,
  TrendingUp,
  Target,
  Sparkles,
  Plus,
  Edit3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { CHART_COLORS, SECTOR_COLORS, PERENNIAL_SECTORS } from '../../data/mockData';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

const GLASS = 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

const EMPTY_GOAL = { ticker: '', targetQty: '', targetType: 'qty', targetValue: '', note: '' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Custom tooltips
// ---------------------------------------------------------------------------

function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${GLASS} px-4 py-3 text-sm shadow-lg`}>
      <p className="text-slate-200 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value} cotas
        </p>
      ))}
    </div>
  );
}

function SectorPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { sector, value, pct } = payload[0].payload;
  return (
    <div className={`${GLASS} px-3 py-2 text-xs shadow-lg`}>
      <p className="font-medium text-slate-200">{sector}</p>
      <p className="text-slate-400">
        {formatBRL(value)} &middot; {pct.toFixed(1)}%
      </p>
    </div>
  );
}

function renderSectorLabel({ cx, cy, midAngle, outerRadius, sector, pct }) {
  if (pct < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#cbd5e1"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[11px]"
    >
      {sector} {pct.toFixed(0)}%
    </text>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, sub, icon, iconBg, iconColor }) {
  const IconComp = icon;
  return (
    <div className={`${GLASS} p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          <IconComp size={18} className={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AccumulationTab() {
  const {
    brStocks,
    fiis,
    intlStocks,
    fiEtfs,
    fixedIncome,
    cashAccounts,
    dividends,
    dividendsSummary,
    accumulationGoals,
    setAccumulationGoals,
    accumulationHistory,
    currency,
    exchangeRate,
  } = useApp();

  // CRUD state for goals
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL);

  // ---- Build combined asset map -------------------------------------------
  const allAssets = useMemo(() => {
    const map = {};
    for (const s of brStocks) {
      const medianDiv = median(s.dividends5y);
      map[s.ticker] = {
        ticker: s.ticker,
        name: s.name,
        type: 'Acao',
        sector: s.sector,
        qty: s.qty,
        avgPrice: s.avgPrice,
        currentPrice: s.currentPrice,
        lpa: s.lpa,
        vpa: s.vpa,
        annualDiv: medianDiv,
        dyCurrentPct: s.currentPrice > 0 ? (medianDiv / s.currentPrice) * 100 : 0,
        dividends5y: s.dividends5y,
      };
    }
    for (const f of fiis) {
      const annualDiv = f.lastDividend * 12;
      map[f.ticker] = {
        ticker: f.ticker,
        name: f.name,
        type: 'FII',
        sector: f.sector,
        qty: f.qty,
        avgPrice: f.avgPrice,
        currentPrice: f.currentPrice,
        lpa: null,
        vpa: null,
        annualDiv,
        dyCurrentPct: f.dy12m,
        dividends5y: null,
      };
    }
    for (const s of intlStocks) {
      const medianDiv = median(s.dividends5y);
      map[s.ticker] = {
        ticker: s.ticker,
        name: s.name,
        type: 'Acao Intl',
        sector: s.sector,
        qty: s.qty,
        avgPrice: (s.avgPriceUsd || 0) * exchangeRate,
        currentPrice: (s.currentPriceUsd || 0) * exchangeRate,
        lpa: s.lpa,
        vpa: s.vpa,
        annualDiv: medianDiv * exchangeRate,
        dyCurrentPct: s.currentPriceUsd > 0 ? (medianDiv / s.currentPriceUsd) * 100 : 0,
        dividends5y: s.dividends5y,
      };
    }
    for (const e of fiEtfs) {
      map[e.ticker] = {
        ticker: e.ticker,
        name: e.name,
        type: 'ETF RF',
        sector: 'Renda Fixa',
        qty: e.qty,
        avgPrice: e.avgPrice,
        currentPrice: e.currentPrice,
        lpa: null,
        vpa: null,
        annualDiv: 0,
        dyCurrentPct: 0,
        dividends5y: null,
      };
    }
    for (const f of fixedIncome) {
      map[f.title || f.id] = {
        ticker: f.title || f.id,
        name: f.title,
        type: 'Renda Fixa',
        sector: 'Renda Fixa',
        qty: 1,
        avgPrice: f.appliedValue || 0,
        currentPrice: f.currentValue || 0,
        lpa: null,
        vpa: null,
        annualDiv: 0,
        dyCurrentPct: 0,
        dividends5y: null,
      };
    }
    for (const c of cashAccounts) {
      map[c.name || c.id] = {
        ticker: c.name || c.id,
        name: c.name,
        type: 'Caixa',
        sector: 'Caixa',
        qty: 1,
        avgPrice: c.balance || 0,
        currentPrice: c.balance || 0,
        lpa: null,
        vpa: null,
        annualDiv: 0,
        dyCurrentPct: 0,
        dividends5y: null,
      };
    }
    return map;
  }, [brStocks, fiis, intlStocks, fiEtfs, fixedIncome, cashAccounts, exchangeRate]);

  // ---- 1. Summary cards data ----------------------------------------------
  const totalShares = useMemo(
    () => brStocks.reduce((s, a) => s + a.qty, 0) + fiis.reduce((s, f) => s + f.qty, 0),
    [brStocks, fiis],
  );

  const projectedMonthlyIncome = useMemo(() => {
    let total = 0;
    for (const a of Object.values(allAssets)) {
      total += a.annualDiv * a.qty;
    }
    return total / 12;
  }, [allAssets]);

  const weightedDY = useMemo(() => {
    let sumDYxPos = 0;
    let sumPos = 0;
    for (const a of Object.values(allAssets)) {
      const pos = a.qty * a.currentPrice;
      sumDYxPos += a.dyCurrentPct * pos;
      sumPos += pos;
    }
    return sumPos > 0 ? sumDYxPos / sumPos : 0;
  }, [allAssets]);

  // ---- 2. Motivational cards data -----------------------------------------
  const motivationalCards = useMemo(() => {
    const cards = [];

    cards.push({
      text: `Voce acumulou ${totalShares.toLocaleString('pt-BR')} cotas no total!`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    });

    let bestTicker = '';
    let bestMonthly = 0;
    for (const a of Object.values(allAssets)) {
      const monthly = (a.annualDiv * a.qty) / 12;
      if (monthly > bestMonthly) {
        bestMonthly = monthly;
        bestTicker = a.ticker;
      }
    }
    if (bestTicker) {
      cards.push({
        text: `Suas acoes de ${bestTicker} ja pagam ${formatBRL(bestMonthly)}/mes`,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
      });
    }

    let closestGoal = null;
    let smallestGap = Infinity;
    for (const g of accumulationGoals) {
      const asset = allAssets[g.ticker];
      if (g.targetType === 'value') {
        const currentValue = asset ? asset.qty * asset.currentPrice : 0;
        const remaining = g.targetValue - currentValue;
        if (remaining > 0 && remaining < smallestGap) {
          smallestGap = remaining;
          closestGoal = { ticker: g.ticker, text: `${formatBRL(remaining)} em ${g.ticker}` };
        }
      } else {
        const currentQty = asset ? asset.qty : 0;
        const remaining = g.targetQty - currentQty;
        if (remaining > 0 && remaining < smallestGap) {
          smallestGap = remaining;
          closestGoal = { ticker: g.ticker, text: `${remaining} cotas de ${g.ticker}` };
        }
      }
    }
    if (closestGoal) {
      cards.push({
        text: `Faltam ${closestGoal.text} para sua meta`,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
      });
    }

    const annualIncome = projectedMonthlyIncome * 12;
    cards.push({
      text: `Sua renda passiva projetada e ${formatBRL(annualIncome)}/ano`,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    });

    return cards;
  }, [totalShares, allAssets, accumulationGoals, projectedMonthlyIncome]);

  // ---- 4a. Sector pie data ------------------------------------------------
  const { sectorData, perennialPct } = useMemo(() => {
    const sectorMap = {};
    for (const a of Object.values(allAssets)) {
      if (a.type === 'Caixa' || a.type === 'Renda Fixa') continue;
      const val = a.qty * a.currentPrice;
      sectorMap[a.sector] = (sectorMap[a.sector] || 0) + val;
    }
    const total = Object.values(sectorMap).reduce((s, v) => s + v, 0);
    const data = Object.entries(sectorMap)
      .map(([sector, value]) => ({
        sector,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        isPerennial: PERENNIAL_SECTORS.includes(sector),
      }))
      .sort((a, b) => b.value - a.value);

    const perPct = data
      .filter((d) => d.isPerennial)
      .reduce((s, d) => s + d.pct, 0);

    return { sectorData: data, perennialPct: perPct };
  }, [allAssets]);

  // ---- 4b. Goals enriched -------------------------------------------------
  const enrichedGoals = useMemo(() => {
    return accumulationGoals.map((g) => {
      const asset = allAssets[g.ticker];
      const currentQty = asset ? asset.qty : 0;
      const currentPrice = asset ? asset.currentPrice : 0;
      const annualDiv = asset ? asset.annualDiv : 0;
      const isValueGoal = g.targetType === 'value';

      if (isValueGoal) {
        const currentValue = currentQty * currentPrice;
        const tv = g.targetValue || 0;
        const progressPct = tv > 0 ? Math.min((currentValue / tv) * 100, 100) : 0;
        const remaining = Math.max(0, tv - currentValue);
        const projectedMonthlyAtGoal = annualDiv > 0 && currentPrice > 0
          ? ((tv / currentPrice) * annualDiv) / 12
          : 0;
        return {
          ...g,
          currentQty,
          currentPrice,
          currentValue,
          remaining,
          progressPct,
          costToComplete: remaining,
          projectedMonthlyAtGoal,
          isValueGoal: true,
        };
      }

      // qty goal (default)
      const remaining = Math.max(0, g.targetQty - currentQty);
      const progressPct = g.targetQty > 0 ? Math.min((currentQty / g.targetQty) * 100, 100) : 0;
      const costToComplete = remaining * currentPrice;
      const projectedMonthlyAtGoal = (g.targetQty * annualDiv) / 12;

      return {
        ...g,
        currentQty,
        currentPrice,
        remaining,
        progressPct,
        costToComplete,
        projectedMonthlyAtGoal,
        isValueGoal: false,
      };
    });
  }, [accumulationGoals, allAssets]);

  // ---- 5. Fundamentals table data -----------------------------------------
  const fundamentalsData = useMemo(() => {
    const divReceivedMap = {};
    for (const d of dividends) {
      divReceivedMap[d.ticker] = (divReceivedMap[d.ticker] || 0) + d.value;
    }

    return Object.values(allAssets)
      .filter(a => a.type === 'Acao' || a.type === 'FII')
      .map((a) => {
        const yoc = yieldOnCost(a.annualDiv, a.avgPrice);
        const pl = a.lpa && a.lpa > 0 ? a.currentPrice / a.lpa : null;
        const divsReceived = divReceivedMap[a.ticker] || 0;
        const divMonthly = (a.annualDiv * a.qty) / 12;

        return {
          ...a,
          yocPct: yoc,
          pl,
          divsReceived,
          divMonthly,
        };
      })
      .sort((a, b) => b.yocPct - a.yocPct);
  }, [allAssets, dividends]);

  // ---- CRUD handlers for goals -------------------------------------------

  function handleAddGoal() {
    setEditingGoal(null);
    setGoalForm(EMPTY_GOAL);
    setGoalModalOpen(true);
  }

  function handleEditGoal(goal) {
    setEditingGoal(goal);
    setGoalForm({
      ticker: goal.ticker,
      targetQty: String(goal.targetQty),
      targetType: goal.targetType || 'qty',
      targetValue: String(goal.targetValue || ''),
      note: goal.note,
    });
    setGoalModalOpen(true);
  }

  function handleSaveGoal() {
    const isValueGoal = goalForm.targetType === 'value';
    const parsed = {
      id: editingGoal ? editingGoal.id : `goal-${Date.now()}`,
      ticker: goalForm.ticker.trim().toUpperCase(),
      targetQty: isValueGoal ? 0 : (Number(goalForm.targetQty) || 0),
      targetType: goalForm.targetType,
      targetValue: isValueGoal ? (Number(goalForm.targetValue) || 0) : 0,
      note: goalForm.note.trim(),
    };
    if (!parsed.ticker) return;
    if (isValueGoal && parsed.targetValue <= 0) return;
    if (!isValueGoal && parsed.targetQty <= 0) return;

    if (editingGoal) {
      setAccumulationGoals((prev) =>
        prev.map((g) => (g.id === editingGoal.id ? parsed : g)),
      );
    } else {
      setAccumulationGoals((prev) => [...prev, parsed]);
    }
    setGoalModalOpen(false);
  }

  function handleDeleteGoal() {
    setAccumulationGoals((prev) =>
      prev.filter((g) => g.id !== editingGoal.id),
    );
    setGoalModalOpen(false);
  }

  // ---- Render -------------------------------------------------------------
  return (
    <section className="space-y-6">
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
          <Sprout size={22} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Acumulacao</h2>
          <p className="text-xs text-slate-500">
            Filosofia Barsi &mdash; Foco em cotas, dividendos e renda passiva
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. Summary Cards                                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total de Cotas"
          value={totalShares.toLocaleString('pt-BR')}
          sub={`${brStocks.reduce((s, a) => s + a.qty, 0)} acoes + ${fiis.reduce((s, f) => s + f.qty, 0)} FIIs`}
          icon={Sprout}
          iconBg="bg-emerald-500/20"
          iconColor="text-emerald-400"
        />
        <SummaryCard
          label="Proventos no Mes"
          value={formatCurrency(dividendsSummary.monthTotal, currency, exchangeRate)}
          icon={TrendingUp}
          iconBg="bg-indigo-500/20"
          iconColor="text-indigo-400"
        />
        <SummaryCard
          label="Renda Passiva Mensal (Proj.)"
          value={formatCurrency(projectedMonthlyIncome, currency, exchangeRate)}
          sub="Baseado na mediana dos dividendos"
          icon={Target}
          iconBg="bg-violet-500/20"
          iconColor="text-violet-400"
        />
        <SummaryCard
          label="DY Medio Ponderado"
          value={formatPctUnsigned(weightedDY)}
          icon={Sparkles}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
        />
      </div>

      {/* ================================================================= */}
      {/* 2. Motivational Cards                                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {motivationalCards.map((card, idx) => (
          <div
            key={idx}
            className={`${GLASS} p-4 ${card.bg} border-none`}
          >
            <p className={`text-sm font-medium ${card.color}`}>{card.text}</p>
          </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* 3. Evolucao de Cotas (AreaChart)                                   */}
      {/* ================================================================= */}
      <div className={`${GLASS} p-6`}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Evolucao de Cotas
          </h3>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={accumulationHistory}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradBr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradFii" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <Tooltip content={<AreaTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-slate-300 text-sm">{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="brShares"
                name="Acoes BR"
                stackId="1"
                stroke="#6366f1"
                fill="url(#gradBr)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="fiiShares"
                name="FIIs"
                stackId="1"
                stroke="#8b5cf6"
                fill="url(#gradFii)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. Grid 2 cols: Sector Pie + Goals                                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ------ 4a. Sector Pie ----- */}
        <div className={`${GLASS} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-violet-400" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Distribuicao por Setor
            </h3>
          </div>

          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="sector"
                  label={renderSectorLabel}
                  labelLine={false}
                  stroke="none"
                >
                  {sectorData.map((entry) => (
                    <Cell
                      key={entry.sector}
                      fill={SECTOR_COLORS[entry.sector] || CHART_COLORS[0]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<SectorPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
              Sem dados de alocacao
            </div>
          )}

          {/* Legend with perennial badges */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {sectorData.map((entry) => (
              <div key={entry.sector} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[entry.sector] || CHART_COLORS[0] }}
                />
                <span className="text-slate-300">
                  {entry.sector}{' '}
                  <span className="text-slate-500">({entry.pct.toFixed(1)}%)</span>
                </span>
                {entry.isPerennial && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Perene
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Perennial footer */}
          <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-emerald-400">
              {formatPctUnsigned(perennialPct)} em setores perenes (Barsi)
            </p>
          </div>
        </div>

        {/* ------ 4b. Metas de Acumulacao ----- */}
        <div className={`${GLASS} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-amber-400" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
                Metas de Acumulacao
              </h3>
            </div>
            <button
              onClick={handleAddGoal}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-600/30"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {enrichedGoals.map((g) => (
              <div
                key={g.id}
                className={`${GLASS} p-4 hover:bg-white/[0.08] hover:border-indigo-500/30 transition-colors cursor-pointer`}
                onClick={() => handleEditGoal(g)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-white">{g.ticker}</span>
                    <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                      g.isValueGoal
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-indigo-500/15 text-indigo-400'
                    }`}>
                      {g.isValueGoal ? 'R$' : 'Cotas'}
                    </span>
                    <span className="text-xs text-slate-500">{g.note}</span>
                  </div>
                  <Edit3 size={14} className="text-slate-500" />
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>
                      {g.isValueGoal
                        ? `${formatBRL(g.currentValue || 0)} / ${formatBRL(g.targetValue)}`
                        : `${g.currentQty} / ${g.targetQty} cotas`}
                    </span>
                    <span className={g.progressPct >= 100 ? 'text-emerald-400' : 'text-slate-300'}>
                      {g.progressPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${g.progressPct}%`,
                        background: g.progressPct >= 100
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>
                    <span className="block text-slate-500">Faltam</span>
                    <span className="text-slate-200">
                      {g.isValueGoal
                        ? formatBRL(g.remaining)
                        : `${g.remaining} cotas`}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Custo p/ completar</span>
                    <span className="text-slate-200">{formatCurrency(g.costToComplete, currency, exchangeRate)}</span>
                  </div>
                  {g.projectedMonthlyAtGoal > 0 && (
                    <div className="col-span-2">
                      <span className="block text-slate-500">Renda mensal ao atingir</span>
                      <span className="text-emerald-400 font-medium">
                        {formatCurrency(g.projectedMonthlyAtGoal, currency, exchangeRate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {enrichedGoals.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">
                Nenhuma meta cadastrada
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. Tabela de Fundamentos                                          */}
      {/* ================================================================= */}
      <div className={`${GLASS} overflow-hidden`}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <TrendingUp size={18} className="text-indigo-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Fundamentos &mdash; Acoes e FIIs
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium">Ticker</th>
                <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium hidden md:table-cell">Nome</th>
                <th className="text-left text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium">Tipo</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium">Qtd</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium hidden sm:table-cell">PM</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium hidden sm:table-cell">Atual</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium">DY %</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium">YoC %</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium hidden lg:table-cell">LPA</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium hidden lg:table-cell">P/L</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium hidden md:table-cell">Divs. Receb.</th>
                <th className="text-right text-slate-400 text-xs uppercase tracking-wider py-3 px-3 font-medium">Div. Mensal</th>
              </tr>
            </thead>
            <tbody>
              {fundamentalsData.map((row, idx) => {
                const yocColor =
                  row.yocPct >= 8
                    ? 'text-emerald-400'
                    : row.yocPct >= 4
                    ? 'text-amber-400'
                    : 'text-slate-300';
                const typeBadge =
                  row.type === 'Acao'
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'bg-violet-500/15 text-violet-400';

                return (
                  <tr
                    key={row.ticker}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                      idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span className="font-medium text-slate-200">{row.ticker}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-400 hidden md:table-cell">{row.name}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-200 tabular-nums">{row.qty}</td>
                    <td className="px-3 py-3 text-right text-slate-300 tabular-nums hidden sm:table-cell">{formatBRL(row.avgPrice)}</td>
                    <td className="px-3 py-3 text-right text-slate-300 tabular-nums hidden sm:table-cell">{formatBRL(row.currentPrice)}</td>
                    <td className="px-3 py-3 text-right text-slate-200 tabular-nums">{formatPctUnsigned(row.dyCurrentPct)}</td>
                    <td className={`px-3 py-3 text-right font-medium tabular-nums ${yocColor}`}>{formatPctUnsigned(row.yocPct)}</td>
                    <td className="px-3 py-3 text-right text-slate-300 tabular-nums hidden lg:table-cell">
                      {row.lpa != null ? row.lpa.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-300 tabular-nums hidden lg:table-cell">
                      {row.pl != null ? row.pl.toFixed(1).replace('.', ',') : '-'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-200 tabular-nums hidden md:table-cell">
                      {formatCurrency(row.divsReceived, currency, exchangeRate)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-medium tabular-nums">
                      {formatCurrency(row.divMonthly, currency, exchangeRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Goal CRUD Modal                                                    */}
      {/* ================================================================= */}
      <FormModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={editingGoal ? `Editar Meta - ${editingGoal.ticker}` : 'Adicionar Meta'}
        onSave={handleSaveGoal}
        onDelete={editingGoal ? handleDeleteGoal : undefined}
      >
        <FormField label="Ticker / Ativo">
          <FormInput
            value={goalForm.ticker}
            onChange={(e) => setGoalForm({ ...goalForm, ticker: e.target.value })}
            placeholder="Ex: ITUB4, AAPL, IMAB11"
          />
        </FormField>
        <FormField label="Tipo de Meta">
          <FormSelect
            value={goalForm.targetType}
            onChange={(e) => setGoalForm({ ...goalForm, targetType: e.target.value })}
          >
            <option value="qty">Quantidade de Cotas</option>
            <option value="value">Valor Investido (R$)</option>
          </FormSelect>
        </FormField>
        {goalForm.targetType === 'qty' ? (
          <FormField label="Meta de Cotas">
            <FormInput
              type="number"
              value={goalForm.targetQty}
              onChange={(e) => setGoalForm({ ...goalForm, targetQty: e.target.value })}
              placeholder="Ex: 500"
              min="1"
            />
          </FormField>
        ) : (
          <FormField label="Meta em R$">
            <FormInput
              type="number"
              value={goalForm.targetValue}
              onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
              placeholder="Ex: 50000"
              min="1"
              step="100"
            />
          </FormField>
        )}
        <FormField label="Observacao">
          <FormInput
            value={goalForm.note}
            onChange={(e) => setGoalForm({ ...goalForm, note: e.target.value })}
            placeholder="Ex: Acumular banco perene"
          />
        </FormField>
      </FormModal>
    </section>
  );
}
