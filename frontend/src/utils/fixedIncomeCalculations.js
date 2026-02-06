// ========================================================
// Fixed Income Calculations
// Computes current values, IR tax, quota system, benchmarks
// ========================================================

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Parse BCB date string "DD/MM/YYYY" to JS Date */
export function parseBcbDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** Parse ISO date string "YYYY-MM-DD" to JS Date */
function parseIsoDate(str) {
  if (!str) return null;
  return new Date(str + 'T00:00:00');
}

/** Format Date to DD/MM/YYYY */
function formatDDMMYYYY(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/** Check if a date is a weekday (simplified business day check, no holidays) */
function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/** Count business days between two dates (simplified: weekdays only) */
export function businessDaysBetween(start, end) {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current < endDate) {
    current.setDate(current.getDate() + 1);
    if (isWeekday(current)) count++;
  }
  return count;
}

/** Format Date to YYYY-MM-DD string */
function toIsoString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Value calculation per indexer
// ---------------------------------------------------------------------------

/**
 * CDI-based bond: iterates daily CDI series, applies contracted percentage.
 * contractedRate is the percentage of CDI (e.g. 120 means 120% of CDI).
 */
export function calcValueCDI(appliedValue, applicationDate, contractedRate, cdiDailySeries) {
  if (!cdiDailySeries?.length) return appliedValue;
  const appDate = parseIsoDate(applicationDate);
  if (!appDate) return appliedValue;

  const pct = contractedRate / 100; // e.g. 120% -> 1.2
  let accumulated = appliedValue;

  for (const entry of cdiDailySeries) {
    const entryDate = parseBcbDate(entry.date);
    if (!entryDate || entryDate <= appDate) continue;
    // daily CDI rate in %; apply contracted percentage
    const dailyRate = entry.value / 100; // e.g. 0.0538% -> 0.000538
    accumulated *= 1 + dailyRate * pct;
  }

  return accumulated;
}

/**
 * IPCA-based bond: accumulates monthly IPCA + daily pro-rata of annual prefixed rate.
 * contractedRate is the annual spread (e.g. 6.20 means IPCA + 6.20% a.a.).
 */
export function calcValueIPCA(appliedValue, applicationDate, contractedRate, ipcaMonthlySeries) {
  if (!ipcaMonthlySeries?.length) return appliedValue;
  const appDate = parseIsoDate(applicationDate);
  if (!appDate) return appliedValue;

  // Count business days from application to today for spread
  const today = new Date();
  const busDays = businessDaysBetween(appDate, today);
  const dailySpreadFactor = Math.pow(1 + contractedRate / 100, 1 / 252);

  // Accumulate IPCA monthly factors
  let ipcaFactor = 1;
  for (const entry of ipcaMonthlySeries) {
    const entryDate = parseBcbDate(entry.date);
    if (!entryDate || entryDate <= appDate) continue;
    ipcaFactor *= 1 + entry.value / 100;
  }

  // Apply spread over business days
  const spreadFactor = Math.pow(dailySpreadFactor, busDays);

  return appliedValue * ipcaFactor * spreadFactor;
}

/**
 * Selic-based bond: iterates daily Selic series with contracted percentage.
 * contractedRate is percentage of Selic (e.g. 100 means 100% of Selic).
 */
export function calcValueSelic(appliedValue, applicationDate, contractedRate, selicDailySeries) {
  if (!selicDailySeries?.length) return appliedValue;
  const appDate = parseIsoDate(applicationDate);
  if (!appDate) return appliedValue;

  const pct = contractedRate / 100;
  let accumulated = appliedValue;

  for (const entry of selicDailySeries) {
    const entryDate = parseBcbDate(entry.date);
    if (!entryDate || entryDate <= appDate) continue;
    const dailyRate = entry.value / 100;
    accumulated *= 1 + dailyRate * pct;
  }

  return accumulated;
}

/**
 * Prefixado bond: (1 + rate/100) ^ (businessDays / 252) compounding.
 */
export function calcValuePrefixado(appliedValue, applicationDate, contractedRate) {
  const appDate = parseIsoDate(applicationDate);
  if (!appDate) return appliedValue;
  const today = new Date();
  const busDays = businessDaysBetween(appDate, today);
  return appliedValue * Math.pow(1 + contractedRate / 100, busDays / 252);
}

/**
 * Dispatcher: calculates current value based on bond's indexer.
 */
export function calculateCurrentValue(bond, historicalData) {
  if (!historicalData) return bond.currentValue || bond.appliedValue;

  const cdiSeries = historicalData['12'] || [];
  const ipcaSeries = historicalData['433'] || [];
  const selicSeries = historicalData['11'] || [];

  switch (bond.indexer) {
    case 'CDI':
      return calcValueCDI(bond.appliedValue, bond.applicationDate, bond.contractedRate, cdiSeries);
    case 'IPCA':
      return calcValueIPCA(bond.appliedValue, bond.applicationDate, bond.contractedRate, ipcaSeries);
    case 'Selic':
      return calcValueSelic(bond.appliedValue, bond.applicationDate, bond.contractedRate, selicSeries);
    case 'Prefixado':
      return calcValuePrefixado(bond.appliedValue, bond.applicationDate, bond.contractedRate);
    default:
      return bond.currentValue || bond.appliedValue;
  }
}

// ---------------------------------------------------------------------------
// IR (Income Tax) calculation — regressive table
// ---------------------------------------------------------------------------

/** Returns IR rate based on days since application */
export function getIRRate(applicationDate) {
  const appDate = parseIsoDate(applicationDate);
  if (!appDate) return 0.225;
  const today = new Date();
  const diffDays = Math.floor((today - appDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 180) return 0.225;    // 22.5%
  if (diffDays <= 360) return 0.20;     // 20.0%
  if (diffDays <= 720) return 0.175;    // 17.5%
  return 0.15;                          // 15.0%
}

/** Calculate net value after IR (tax applied only on gain) */
export function calculateNetValue(grossValue, appliedValue, applicationDate, taxExempt) {
  if (taxExempt) return grossValue;
  const gain = grossValue - appliedValue;
  if (gain <= 0) return grossValue;
  const irRate = getIRRate(applicationDate);
  return grossValue - gain * irRate;
}

// ---------------------------------------------------------------------------
// Bond status
// ---------------------------------------------------------------------------

function getBondStatus(maturityDate) {
  const maturity = parseIsoDate(maturityDate);
  if (!maturity) return { label: '-', color: 'slate' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((maturity - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Vencido', color: 'amber' };
  if (diffDays <= 30) return { label: '< 30d', color: 'amber' };
  return { label: 'Ativo', color: 'emerald' };
}

// ---------------------------------------------------------------------------
// Summary: enriches bonds with computed values
// ---------------------------------------------------------------------------

export function calculateFixedIncomeSummary(bonds, historicalData) {
  const enrichedBonds = bonds.map((bond) => {
    const grossValue = historicalData
      ? calculateCurrentValue(bond, historicalData)
      : bond.currentValue || bond.appliedValue;

    const irRate = bond.taxExempt ? 0 : getIRRate(bond.applicationDate);
    const gain = grossValue - bond.appliedValue;
    const ir = bond.taxExempt ? 0 : Math.max(0, gain * irRate);
    const netValue = grossValue - ir;
    const returnPct = bond.appliedValue > 0
      ? ((grossValue - bond.appliedValue) / bond.appliedValue) * 100
      : 0;
    const netReturnPct = bond.appliedValue > 0
      ? ((netValue - bond.appliedValue) / bond.appliedValue) * 100
      : 0;
    const status = getBondStatus(bond.maturityDate);

    return {
      ...bond,
      grossValue,
      netValue,
      ir,
      irRate,
      returnPct,
      netReturnPct,
      status,
    };
  });

  const activeBonds = enrichedBonds.filter((b) => b.status.label !== 'Vencido');
  const totalApplied = enrichedBonds.reduce((s, b) => s + b.appliedValue, 0);
  const totalGross = enrichedBonds.reduce((s, b) => s + b.grossValue, 0);
  const totalIR = enrichedBonds.reduce((s, b) => s + b.ir, 0);
  const totalNet = enrichedBonds.reduce((s, b) => s + b.netValue, 0);
  const totalGrossReturn = totalGross - totalApplied;
  const totalNetReturn = totalNet - totalApplied;
  const grossReturnPct = totalApplied > 0 ? (totalGrossReturn / totalApplied) * 100 : 0;
  const netReturnPct = totalApplied > 0 ? (totalNetReturn / totalApplied) * 100 : 0;

  return {
    bonds: enrichedBonds,
    totals: {
      totalApplied,
      totalGross,
      totalIR,
      totalNet,
      totalGrossReturn,
      totalNetReturn,
      grossReturnPct,
      netReturnPct,
      activeBonds: activeBonds.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Quota system (computed on-the-fly from bond data)
// ---------------------------------------------------------------------------

/**
 * Builds a quota-value time series for the fixed income portfolio.
 * For each business day from the earliest bond application to today:
 *  1. New bonds at that date get quotas at current quota price
 *  2. Portfolio value = sum of all active bond values at that date
 *  3. Quota value = total value / total quotas
 */
export function buildQuotaHistory(bonds, historicalData) {
  if (!bonds.length || !historicalData) return [];

  const cdiSeries = historicalData['12'] || [];
  const selicSeries = historicalData['11'] || [];
  // Fallback to Selic if CDI is unavailable (they track closely)
  const rateSeries = cdiSeries.length ? cdiSeries : selicSeries;
  if (!rateSeries.length) return [];

  // Build a date->rate map for daily iteration
  const cdiByDate = new Map();
  for (const entry of rateSeries) {
    cdiByDate.set(entry.date, entry.value);
  }

  // Get all BCB dates sorted
  const allDates = rateSeries.map((e) => e.date);
  if (!allDates.length) return [];

  // Find earliest application date
  const appDates = bonds
    .map((b) => parseIsoDate(b.applicationDate))
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (!appDates.length) return [];

  const startDate = appDates[0];
  const INITIAL_QUOTA_VALUE = 1000; // initial quota value in R$

  let totalQuotas = 0;
  const bondQuotas = {}; // bondId -> quotas assigned

  const history = [];
  let currentQuotaValue = INITIAL_QUOTA_VALUE;

  for (const dateStr of allDates) {
    const date = parseBcbDate(dateStr);
    if (!date || date < startDate) continue;

    const isoDate = toIsoString(date);

    // Check if any bonds start on this date -> assign quotas
    for (const bond of bonds) {
      if (bondQuotas[bond.id]) continue; // already has quotas
      const bondAppDate = parseIsoDate(bond.applicationDate);
      if (!bondAppDate) continue;
      if (isoDate === toIsoString(bondAppDate) || (date >= bondAppDate && !bondQuotas[bond.id])) {
        const quotasForBond = bond.appliedValue / currentQuotaValue;
        bondQuotas[bond.id] = quotasForBond;
        totalQuotas += quotasForBond;
      }
    }

    if (totalQuotas === 0) continue;

    // Calculate total portfolio value at this date using accumulated CDI
    // (simplified: use CDI as proxy for all bond types in quota history)
    let totalValue = 0;
    for (const bond of bonds) {
      if (!bondQuotas[bond.id]) continue;
      // Simple: each bond's value = its quota share * current quota value
      // We update quota value based on CDI return for the day
    }

    // Apply daily CDI return to update quota value
    const dailyCdi = cdiByDate.get(dateStr);
    if (dailyCdi != null) {
      currentQuotaValue *= 1 + dailyCdi / 100;
    }

    totalValue = totalQuotas * currentQuotaValue;

    history.push({
      date: isoDate,
      quotaValue: currentQuotaValue,
      totalValue,
      totalQuotas,
    });
  }

  return history;
}

// ---------------------------------------------------------------------------
// Benchmark series (normalized to 0% return from start date)
// ---------------------------------------------------------------------------

export function buildBenchmarkSeries(startDate, historicalData) {
  if (!historicalData) return {};

  const cdiSeries = historicalData['12'] || [];
  const ipcaSeries = historicalData['433'] || [];
  const selicSeries = historicalData['11'] || [];

  const start = typeof startDate === 'string' ? parseIsoDate(startDate) : startDate;

  function buildAccumulated(series, label, pctMultiplier = 1) {
    let acc = 1;
    const result = [];
    for (const entry of series) {
      const date = parseBcbDate(entry.date);
      if (!date || date < start) continue;
      acc *= 1 + (entry.value / 100) * pctMultiplier;
      result.push({ date: toIsoString(date), value: (acc - 1) * 100 });
    }
    return result;
  }

  // CDI: 100% of daily CDI
  const cdi = buildAccumulated(cdiSeries, 'CDI');

  // Selic: 100% of daily Selic
  const selic = buildAccumulated(selicSeries, 'Selic');

  // IPCA: monthly series accumulated
  const ipca = buildAccumulated(ipcaSeries, 'IPCA');

  // IPCA + 6%: IPCA factor * (1+6%/252)^busDays for each IPCA entry
  const ipca6 = [];
  let ipcaAcc = 1;
  let busDaysFromStart = 0;
  const dailySpread = Math.pow(1.06, 1 / 252);
  let lastDate = start;
  for (const entry of ipcaSeries) {
    const date = parseBcbDate(entry.date);
    if (!date || date < start) continue;
    ipcaAcc *= 1 + entry.value / 100;
    // Estimate business days since last entry
    busDaysFromStart += businessDaysBetween(lastDate, date);
    lastDate = date;
    const spreadFactor = Math.pow(dailySpread, busDaysFromStart);
    ipca6.push({ date: toIsoString(date), value: (ipcaAcc * spreadFactor - 1) * 100 });
  }

  // Poupanca: simplified as 70% of Selic (current rule for Selic > 8.5%)
  const poupanca = buildAccumulated(selicSeries, 'Poupanca', 0.7);

  return { cdi, ipca, ipca6, selic, poupanca };
}

// ---------------------------------------------------------------------------
// Individual bond return series (for chart overlay)
// ---------------------------------------------------------------------------

/**
 * Builds a return-% time series for a single bond based on its indexer.
 * Returns [{ date: 'YYYY-MM-DD', value: returnPct }]
 */
export function buildBondReturnSeries(bond, historicalData) {
  if (!historicalData || !bond.applicationDate || !bond.appliedValue) return [];

  const appDate = parseIsoDate(bond.applicationDate);
  if (!appDate) return [];

  const cdiSeries = historicalData['12'] || [];
  const ipcaSeries = historicalData['433'] || [];
  const selicSeries = historicalData['11'] || [];

  const series = [];

  switch (bond.indexer) {
    case 'CDI': {
      const pct = (bond.contractedRate || 100) / 100;
      let accumulated = bond.appliedValue;
      for (const entry of cdiSeries) {
        const entryDate = parseBcbDate(entry.date);
        if (!entryDate || entryDate <= appDate) continue;
        accumulated *= 1 + (entry.value / 100) * pct;
        series.push({
          date: toIsoString(entryDate),
          value: ((accumulated / bond.appliedValue) - 1) * 100,
        });
      }
      break;
    }
    case 'Selic': {
      const pct = (bond.contractedRate || 100) / 100;
      let accumulated = bond.appliedValue;
      for (const entry of selicSeries) {
        const entryDate = parseBcbDate(entry.date);
        if (!entryDate || entryDate <= appDate) continue;
        accumulated *= 1 + (entry.value / 100) * pct;
        series.push({
          date: toIsoString(entryDate),
          value: ((accumulated / bond.appliedValue) - 1) * 100,
        });
      }
      break;
    }
    case 'IPCA': {
      const dailySpreadFactor = Math.pow(1 + (bond.contractedRate || 0) / 100, 1 / 252);
      let ipcaFactor = 1;
      let busDays = 0;
      let lastDate = appDate;
      for (const entry of ipcaSeries) {
        const entryDate = parseBcbDate(entry.date);
        if (!entryDate || entryDate <= appDate) continue;
        ipcaFactor *= 1 + entry.value / 100;
        busDays += businessDaysBetween(lastDate, entryDate);
        lastDate = entryDate;
        const spreadFactor = Math.pow(dailySpreadFactor, busDays);
        series.push({
          date: toIsoString(entryDate),
          value: (ipcaFactor * spreadFactor - 1) * 100,
        });
      }
      break;
    }
    case 'Prefixado': {
      let bd = 0;
      for (const entry of cdiSeries) {
        const entryDate = parseBcbDate(entry.date);
        if (!entryDate || entryDate <= appDate) continue;
        bd++;
        const factor = Math.pow(1 + (bond.contractedRate || 0) / 100, bd / 252);
        series.push({
          date: toIsoString(entryDate),
          value: (factor - 1) * 100,
        });
      }
      break;
    }
    default:
      break;
  }

  return series;
}

// ---------------------------------------------------------------------------
// Helpers for the tab
// ---------------------------------------------------------------------------

/** Get the earliest application date from a list of bonds as ISO string */
export function getEarliestDate(bonds) {
  if (!bonds.length) return null;
  const dates = bonds
    .map((b) => b.applicationDate)
    .filter(Boolean)
    .sort();
  return dates[0] || null;
}

/** Convert ISO date YYYY-MM-DD to BCB format DD/MM/YYYY */
export function isoToBcb(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/** Get today as DD/MM/YYYY */
export function todayBcb() {
  return formatDDMMYYYY(new Date());
}

/** Auto-generate rate display text from indexer + contractedRate */
export function generateRateText(indexer, contractedRate) {
  if (!indexer || !contractedRate) return '';
  switch (indexer) {
    case 'CDI':
      return `${contractedRate}% CDI`;
    case 'IPCA':
      return `IPCA + ${contractedRate}%`;
    case 'Selic':
      return `${contractedRate}% Selic`;
    case 'Prefixado':
      return `${contractedRate}% a.a.`;
    default:
      return '';
  }
}

/** Check if bond type is tax-exempt by default */
export function isDefaultTaxExempt(type) {
  return ['LCI', 'LCA', 'CRI', 'CRA'].includes(type);
}

/** Indexer distribution for pie chart */
export function getIndexerDistribution(enrichedBonds) {
  const map = {};
  for (const bond of enrichedBonds) {
    const key = bond.indexer || 'Outros';
    map[key] = (map[key] || 0) + bond.grossValue;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
