import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatCurrency, formatPct } from '../../utils/formatters';
import { Eye, Bell, BellRing, Tag, Filter, Plus } from 'lucide-react';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

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
const EMPTY_WATCHLIST = {
  ticker: '', name: '', sector: '', fairPrice: '',
  targetPrice: '', status: 'Interesse',
};

export default function WatchlistTab() {
  const { watchlist, setWatchlist, currency, exchangeRate } = useApp();
  const [activeFilter, setActiveFilter] = useState('Todos');

  // ---- CRUD state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_WATCHLIST);

  function handleAdd() {
    setEditing(null);
    setForm(EMPTY_WATCHLIST);
    setModalOpen(true);
  }

  function handleEdit(item) {
    setEditing(item);
    setForm({
      ticker: item.ticker,
      name: item.name,
      sector: item.sector || '',
      fairPrice: String(item.fairPrice),
      targetPrice: String(item.targetPrice),
      status: item.status || 'Interesse',
    });
    setModalOpen(true);
  }

  function handleSave() {
    const parsed = {
      ticker: form.ticker.toUpperCase().trim(),
      name: form.name.trim(),
      sector: form.sector.trim(),
      currentPrice: editing?.currentPrice || 0,
      fairPrice: Number(form.fairPrice) || 0,
      targetPrice: Number(form.targetPrice) || 0,
      status: form.status,
    };
    if (!parsed.ticker) return;
    if (editing) {
      setWatchlist((prev) => prev.map((w) => (w.ticker === editing.ticker ? parsed : w)));
    } else {
      setWatchlist((prev) => [...prev, parsed]);
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (!editing) return;
    setWatchlist((prev) => prev.filter((w) => w.ticker !== editing.ticker));
    setModalOpen(false);
  }

  // ---- Derived: assets that hit the target price ----------------------------
  const isOnSaleCheck = (w) => w.currentPrice > 0 && w.targetPrice > 0 && w.currentPrice <= w.targetPrice;

  const alerts = useMemo(
    () => watchlist.filter(isOnSaleCheck),
    [watchlist],
  );

  // ---- Derived: filtered list based on active filter ------------------------
  const filteredList = useMemo(() => {
    switch (activeFilter) {
      case 'EmPromocao':
        return watchlist.filter(isOnSaleCheck);
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
        <button
          onClick={handleAdd}
          className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
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
                atingiu{alerts.length > 1 ? 'ram' : ''} o preco maximo de compra!
              </h3>
              <p className="text-xs text-slate-400">
                Esses ativos estao com a cotacao abaixo ou igual ao preco maximo que voce definiu.
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
                    Max. Compra:{' '}
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
                  Cotacao
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3 hidden lg:table-cell">
                  Valor Justo
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3 hidden lg:table-cell">
                  Preco Max. Compra
                </th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">
                  Margem
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
                  const isOnSale = isOnSaleCheck(item);
                  const discount = calcDiscount(
                    item.currentPrice,
                    item.fairPrice,
                  );
                  const discountColor =
                    discount < 0 ? 'text-emerald-400' : 'text-red-400';

                  return (
                    <tr
                      key={item.ticker}
                      onClick={() => handleEdit(item)}
                      className={`border-b border-white/5 transition-colors cursor-pointer ${
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

                      {/* Cotacao (auto-fetched) */}
                      <td className="text-right px-5 py-3.5 text-slate-200 font-medium tabular-nums">
                        {item.currentPrice > 0 ? formatBRL(item.currentPrice) : <span className="text-slate-500">--</span>}
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

      {/* ---- CRUD Modal ---- */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${editing.ticker}` : 'Adicionar a Watchlist'}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ticker">
            <FormInput value={form.ticker} onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))} placeholder="TAEE11" />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="Interesse">Interesse</option>
              <option value="Possui">Possui</option>
            </FormSelect>
          </FormField>
        </div>
        <FormField label="Nome">
          <FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Taesa UNT" />
        </FormField>
        <FormField label="Setor">
          <FormInput value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} placeholder="Energia Eletrica" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Valor Justo (Valuation)" hint="Valor intrinseco estimado por analise fundamentalista (ex: Graham, Bazin, Fluxo de Caixa Descontado). Usado para calcular o desconto/premio do ativo.">
            <FormInput type="number" step="0.01" value={form.fairPrice} onChange={(e) => setForm((f) => ({ ...f, fairPrice: e.target.value }))} placeholder="0.00" />
          </FormField>
          <FormField label="Preco Maximo de Compra" hint="Preco limite que voce esta disposto a pagar. Quando a cotacao cair ate esse valor, um alerta sera disparado.">
            <FormInput type="number" step="0.01" value={form.targetPrice} onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))} placeholder="0.00" />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
