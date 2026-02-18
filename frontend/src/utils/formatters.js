// ========================================================
// Formatação de valores para exibição
// ========================================================

/**
 * Formata número como moeda BRL
 */
export function formatBRL(value) {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número como moeda USD
 */
export function formatUSD(value) {
  if (value == null || isNaN(value)) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formata valor na moeda selecionada
 */
export function formatCurrency(value, currency = 'BRL', exchangeRate = 6.05) {
  if (currency === 'USD') return formatUSD(value / exchangeRate);
  return formatBRL(value);
}

/**
 * Formata porcentagem com sinal
 */
export function formatPct(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0,00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formata porcentagem sem sinal
 */
export function formatPctUnsigned(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0,00%';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formata número grande de forma compacta (K, M, B)
 */
export function formatCompact(value) {
  if (value == null || isNaN(value)) return '0';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

/**
 * Formata data para exibição DD/MM/YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data para exibição curta MMM/YY
 */
export function formatMonthYear(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

/**
 * Formata dias em período legível: "2a 3m", "5m", "15d"
 */
export function formatTimeHeld(days) {
  if (days == null || days <= 0) return '-';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;
  const parts = [];
  if (years > 0) parts.push(`${years}a`);
  if (months > 0) parts.push(`${months}m`);
  if (parts.length === 0) parts.push(`${remainingDays}d`);
  return parts.join(' ');
}

/**
 * Classe CSS baseada em valor positivo/negativo
 */
export function colorClass(value) {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}
