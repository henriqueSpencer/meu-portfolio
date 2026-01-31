import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatCurrency, formatPct } from '../../utils/formatters';
import { Eye, Bell, BellRing, Tag, Filter } from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared glass-card style token (consistent with other tabs)
// ---------------------------------------------------------------------------
const GLASS =
  'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

// ---------------------------------------------------------------------------
// Filter configuration
// ---------------------------------------------------------------------------
const FILTERS = [
  { key: 'Todos', label: 'Todos' },
  { key: 'EmPromocao', label: 'Em Promocao' },
  { key: 'Interesse', label: 'Interesse' },
  { key: 'Possui', label: 'Possui' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function WatchlistTab() {
  const { watchlist, setWatchlist, currency, exchangeRate } = useApp();
  const [activeFilter, setActiveFilter] = useState('Todos');

  // ---- Derived: assets that hit the target price ----------------------------
  const alerts = useMemo(
    () => watchlist.filter((w) => w.currentPrice <= w.targetPrice),
    [watchlist],
  );

  // ---- Derived: filtered list based on active filter ------------------------
  const filteredList = useMemo(() => {
    switch (activeFilter) {
      case 'EmPromocao':
        return watchlist.filter((w) => w.currentPrice <= w.targetPrice);
      case 'Interesse':
        return watchlist.filter((w) => w.status === 'Interesse');
      case 'Possui':
        return watchlist.filter((w) => w.status === 'Possui');
      default:
        return watchlist;
    }
  }, [watchlist, activeFilter]);

  // ---- Helper: calculate discount vs fair price (%) -------------------------
  function calcDiscount(currentPrice, fairPrice) {
    if (!fairPrice || fairPrice === 0) return 0;
    return ((currentPrice - fairPrice) / fairPrice) * 100;
  }

  // ---- Render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. Header                                                         */}
      {/* ================================================================= */}
      <div className="flex items-center gap-3">
        <Eye className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-semibold text-slate-100">Watchlist</h2>
      </div>

      {/* ================================================================= */}
      {/* 2. Alert Summary Card                                             */}
      {/* ================================================================= */}
      {alerts.length > 0 && (
        <div
          className={`${GLASS} p-5`}
          style={{ borderColor: 'rgba(16,185,129,0.45)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
              <BellRing size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-400">
                {alerts.length} ativo{alerts.length > 1 ? 's' : ''}{' '}
                atingiu{alerts.length > 1 ? 'ram' : ''} o preco-alvo!
              </h3>
              <p className="text-xs text-slate-400">
                Esses ativos estao abaixo ou no preco-alvo definido.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((a) => (
              <div
                key={a.ticker}
                className={`${GLASS} flex items-center justify-between p-3 border-l-4 border-emerald-400`}
              >
                <div>
                  <p className="font-semibold text-white text-sm">{a.ticker}</p>
                  <p className="text-xs text-slate-400">{a.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    Atual:{' '}
                    <span className="text-emerald-400 font-medium">
                      {formatBRL(a.currentPrice)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Alvo:{' '}
                    <span className="text-slate-200 font-medium">
                      {formatBRL(a.targetPrice)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. Filter Bar                                                     */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-slate-400 mr-1" />
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          );
        })}

        <span className="ml-auto text-xs text-slate-500">
          {filteredList.length} ativo{filteredList.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ================================================================= */}
      {/* 4. Watchlist Table                                                */}
      {/* ================================================================= */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 font-medium px-5 py-3">
                  Ticker
                </th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">
                  Nome
                </th>
                <th className="text-left text-slate-400 font-medium px-5 py-3 hidden md:table-cell">
                  Setor
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Preco Atual
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3 hidden lg:table-cell">
                  Preco Justo
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3 hidden lg:table-cell">
                  Preco-Alvo
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Desconto
                </th>
                <th className="text-center text-slate-400 font-medium px-5 py-3">
                  Status
                </th>
                <th className="text-center text-slate-400 font-medium px-5 py-3 w-12">
                  <Bell size={14} className="inline-block" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-slate-500 text-sm"
                  >
                    Nenhum ativo encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isOnSale = item.currentPrice <= item.targetPrice;
                  const discount = calcDiscount(
                    item.currentPrice,
                    item.fairPrice,
                  );
                  const discountColor =
                    discount < 0 ? 'text-emerald-400' : 'text-red-400';

                  return (
                    <tr
                      key={item.ticker}
                      className={`border-b border-white/5 transition-colors ${
                        idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                      } ${
                        isOnSale
                          ? 'border-l-4 border-l-emerald-400 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]'
                          : 'hover:bg-white/[0.03]'
                      }`}
                      style={
                        isOnSale
                          ? {
                              boxShadow:
                                'inset 0 0 20px rgba(16, 185, 129, 0.04)',
                            }
                          : undefined
                      }
                    >
                      {/* Ticker */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-white">
                          {item.ticker}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5 text-slate-300">
                        {item.name}
                      </td>

                      {/* Sector */}
                      <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={12} className="text-slate-500" />
                          {item.sector}
                        </span>
                      </td>

                      {/* Current Price */}
                      <td className="text-right px-5 py-3.5 text-slate-200 font-medium tabular-nums">
                        {formatBRL(item.currentPrice)}
                      </td>

                      {/* Fair Price */}
                      <td className="text-right px-5 py-3.5 text-slate-400 tabular-nums hidden lg:table-cell">
                        {formatBRL(item.fairPrice)}
                      </td>

                      {/* Target Price */}
                      <td className="text-right px-5 py-3.5 text-slate-400 tabular-nums hidden lg:table-cell">
                        {formatBRL(item.targetPrice)}
                      </td>

                      {/* Discount vs Fair Price */}
                      <td
                        className={`text-right px-5 py-3.5 font-semibold tabular-nums ${discountColor}`}
                      >
                        {formatPct(discount)}
                      </td>

                      {/* Status Badge */}
                      <td className="text-center px-5 py-3.5">
                        {item.status === 'Possui' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                            Possui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">
                            Interesse
                          </span>
                        )}
                      </td>

                      {/* Alert Indicator */}
                      <td className="text-center px-5 py-3.5">
                        {isOnSale ? (
                          <BellRing
                            size={16}
                            className="inline-block text-emerald-400 animate-pulse"
                          />
                        ) : (
                          <Bell
                            size={16}
                            className="inline-block text-slate-600"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. Footer Summary                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span>
          Total na watchlist:{' '}
          <span className="text-slate-300 font-medium">
            {watchlist.length}
          </span>
        </span>
        <span>
          Em promocao:{' '}
          <span className="text-emerald-400 font-medium">{alerts.length}</span>
        </span>
        <span>
          Interesse:{' '}
          <span className="text-purple-400 font-medium">
            {watchlist.filter((w) => w.status === 'Interesse').length}
          </span>
        </span>
        <span>
          Possui:{' '}
          <span className="text-blue-400 font-medium">
            {watchlist.filter((w) => w.status === 'Possui').length}
          </span>
        </span>
      </div>
    </div>
  );
}
