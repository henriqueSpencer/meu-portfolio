// ========================================================
// Cálculos financeiros
// ========================================================

/**
 * Preço Justo Graham: sqrt(22.5 * LPA * VPA)
 * Retorna null se LPA ou VPA forem negativos ou nulos
 */
export function grahamFairPrice(lpa, vpa) {
  if (!lpa || !vpa || lpa <= 0 || vpa <= 0) return null;
  return Math.sqrt(22.5 * lpa * vpa);
}

/**
 * Preço Justo Bazin: mediana dos dividendos dos últimos 5 anos / 0.06
 * O preço que daria 6% de DY com base na mediana histórica
 */
export function bazinFairPrice(dividends5y) {
  if (!dividends5y || dividends5y.length === 0) return null;
  const sorted = [...dividends5y].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
  return median / 0.06;
}

/**
 * Desconto/prêmio em relação ao preço justo
 * Retorna % (negativo = desconto, positivo = prêmio)
 */
export function discountPremium(currentPrice, fairPrice) {
  if (!fairPrice || fairPrice === 0) return null;
  return ((currentPrice - fairPrice) / fairPrice) * 100;
}

/**
 * Indicador visual do desconto: verde (desconto >15%), amarelo (próximo), vermelho (prêmio >15%)
 */
export function priceIndicator(discountPct) {
  if (discountPct === null) return 'neutral';
  if (discountPct <= -15) return 'positive';   // Grande desconto
  if (discountPct <= 0) return 'warning';       // Pequeno desconto
  if (discountPct <= 15) return 'warning';      // Pequeno prêmio
  return 'negative';                            // Grande prêmio
}

/**
 * Yield on Cost: dividendo anualizado / preço médio * 100
 */
export function yieldOnCost(annualDividendPerShare, avgPrice) {
  if (!avgPrice || avgPrice === 0) return 0;
  return (annualDividendPerShare / avgPrice) * 100;
}

/**
 * Calcula a alocação atual por classe de ativo
 */
export function calculateAllocation(brStocks, fiis, intlStocks, fixedIncome, exchangeRate) {
  const rvBrasil = brStocks.reduce((sum, s) => sum + s.qty * s.currentPrice, 0);
  const fiisTotal = fiis.reduce((sum, f) => sum + f.qty * f.currentPrice, 0);
  const rvExterior = intlStocks.reduce((sum, s) => sum + s.qty * s.currentPriceUsd * exchangeRate, 0);
  const rfTotal = fixedIncome.reduce((sum, f) => sum + f.currentValue, 0);
  const cripto = 0; // Placeholder
  const reserva = 0; // Placeholder

  const total = rvBrasil + fiisTotal + rvExterior + rfTotal + cripto + reserva;

  return {
    total,
    classes: [
      { class: 'RV Brasil', value: rvBrasil, pct: total ? (rvBrasil / total * 100) : 0 },
      { class: 'FIIs', value: fiisTotal, pct: total ? (fiisTotal / total * 100) : 0 },
      { class: 'RV Exterior', value: rvExterior, pct: total ? (rvExterior / total * 100) : 0 },
      { class: 'Renda Fixa', value: rfTotal, pct: total ? (rfTotal / total * 100) : 0 },
      { class: 'Cripto', value: cripto, pct: total ? (cripto / total * 100) : 0 },
      { class: 'Reserva Emergência', value: reserva, pct: total ? (reserva / total * 100) : 0 },
    ],
  };
}

/**
 * Sugere alocação de aporte mensal baseado nas maiores diferenças em relação às metas
 */
export function suggestAllocation(amount, currentAllocation, targets) {
  const diffs = targets.map(t => {
    const current = currentAllocation.find(c => c.class === t.class);
    const currentPct = current ? current.pct : 0;
    return {
      class: t.class,
      target: t.target,
      current: currentPct,
      diff: t.target - currentPct, // Positivo = precisa aportar mais
    };
  }).sort((a, b) => b.diff - a.diff); // Maior déficit primeiro

  // Pega as 2 classes com maior déficit
  const top2 = diffs.filter(d => d.diff > 0).slice(0, 2);
  if (top2.length === 0) return [];

  const totalDiff = top2.reduce((s, d) => s + d.diff, 0);
  return top2.map(d => ({
    ...d,
    suggestedAmount: (d.diff / totalDiff) * amount,
    suggestedPct: (d.diff / totalDiff) * 100,
  }));
}

/**
 * Calcula rentabilidade de um ativo (%)
 */
export function returnPct(currentPrice, avgPrice) {
  if (!avgPrice || avgPrice === 0) return 0;
  return ((currentPrice - avgPrice) / avgPrice) * 100;
}
