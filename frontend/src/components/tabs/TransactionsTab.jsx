import { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { toSnakeCase } from '../../utils/apiHelpers';
import {
  formatBRL,
  formatCurrency,
  formatDate,
} from '../../utils/formatters';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  Filter,
  ShoppingCart,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  SplitSquareHorizontal,
  Gift,
  X,
  Pencil,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import ImportPreviewModal from '../ImportPreviewModal';

const GLASS =
  'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPERATION_TYPES = [
  { value: 'compra', label: 'Compra' },
  { value: 'venda', label: 'Venda' },
  { value: 'aporte', label: 'Aporte' },
  { value: 'resgate', label: 'Resgate' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'desdobramento', label: 'Desdobramento' },
  { value: 'bonificacao', label: 'Bonificacao' },
];

const ASSET_CLASSES = [
  { value: 'br_stock', label: 'Acao BR' },
  { value: 'fii', label: 'FII' },
  { value: 'intl_stock', label: 'Acao Intl' },
  { value: 'fixed_income', label: 'Renda Fixa' },
  { value: 'fi_etf', label: 'ETF Renda Fixa' },
  { value: 'cash_account', label: 'Conta Caixa' },
  { value: 'real_asset', label: 'Imobilizado' },
];

const VALID_OPS = {
  br_stock: ['compra', 'venda', 'transferencia', 'desdobramento', 'bonificacao'],
  fii: ['compra', 'venda', 'transferencia', 'desdobramento', 'bonificacao'],
  intl_stock: ['compra', 'venda', 'transferencia', 'desdobramento', 'bonificacao'],
  fixed_income: ['aporte', 'resgate', 'transferencia'],
  fi_etf: ['compra', 'venda', 'transferencia', 'desdobramento', 'bonificacao'],
  cash_account: ['aporte', 'resgate', 'transferencia'],
  real_asset: ['compra', 'venda'],
};

const OP_BADGE = {
  compra: 'bg-emerald-500/15 text-emerald-400',
  venda: 'bg-red-500/15 text-red-400',
  aporte: 'bg-indigo-500/15 text-indigo-400',
  resgate: 'bg-amber-500/15 text-amber-400',
  transferencia: 'bg-cyan-500/15 text-cyan-400',
  desdobramento: 'bg-purple-500/15 text-purple-400',
  bonificacao: 'bg-violet-500/15 text-violet-400',
};

const OP_ICON = {
  compra: ShoppingCart,
  venda: TrendingDown,
  aporte: ArrowDownCircle,
  resgate: ArrowUpCircle,
  transferencia: Repeat,
  desdobramento: SplitSquareHorizontal,
  bonificacao: Gift,
};

const CLASS_LABEL = {
  br_stock: 'Acao BR',
  fii: 'FII',
  intl_stock: 'Acao Intl',
  fixed_income: 'Renda Fixa',
  fi_etf: 'ETF RF',
  cash_account: 'Caixa',
  real_asset: 'Imobilizado',
};

// ---------------------------------------------------------------------------
// Form initial state
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  operationType: '',
  assetClass: '',
  ticker: '',
  assetId: '',
  assetName: '',
  qty: '',
  unitPrice: '',
  totalValue: '',
  broker: '',
  brokerDestination: '',
  fees: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TransactionsTab() {
  const {
    transactions,
    transactionsCrud,
    brStocks,
    fiis,
    intlStocks,
    fixedIncome,
    fiEtfs,
    cashAccounts,
    realAssets,
    currency,
    exchangeRate,
    b3Import,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingTx, setEditingTx] = useState(null);
  const [filterOp, setFilterOp] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // B3 Import state
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await b3Import.preview.mutateAsync(file);
      setImportPreview(result);
    } catch (err) {
      alert(`Erro ao processar arquivo: ${err.message}`);
    }
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleImportConfirm = async (selectedRows) => {
    try {
      await b3Import.confirm.mutateAsync(selectedRows);
      setImportPreview(null);
    } catch (err) {
      alert(`Erro ao importar: ${err.message}`);
    }
  };

  // ---- Available assets for dropdown based on selected class ----
  const availableAssets = useMemo(() => {
    switch (form.assetClass) {
      case 'br_stock':
        return brStocks.map(s => ({ key: s.ticker, label: `${s.ticker} - ${s.name}`, broker: s.broker }));
      case 'fii':
        return fiis.map(f => ({ key: f.ticker, label: `${f.ticker} - ${f.name}`, broker: f.broker }));
      case 'intl_stock':
        return intlStocks.map(s => ({ key: s.ticker, label: `${s.ticker} - ${s.name}`, broker: s.broker }));
      case 'fixed_income':
        return fixedIncome.map(f => ({ key: f.id, label: f.title, broker: f.broker }));
      case 'fi_etf':
        return fiEtfs.map(e => ({ key: e.ticker, label: `${e.ticker} - ${e.name}`, broker: e.broker }));
      case 'cash_account':
        return cashAccounts.map(a => ({ key: a.id, label: `${a.name} (${a.institution})`, broker: a.institution }));
      case 'real_asset':
        return realAssets.map(r => ({ key: r.id, label: r.description, broker: '' }));
      default:
        return [];
    }
  }, [form.assetClass, brStocks, fiis, intlStocks, fixedIncome, fiEtfs, cashAccounts, realAssets]);

  // ---- Allowed operations for selected asset class ----
  const allowedOps = useMemo(() => {
    if (!form.assetClass) return OPERATION_TYPES;
    const valid = VALID_OPS[form.assetClass] || [];
    return OPERATION_TYPES.filter(o => valid.includes(o.value));
  }, [form.assetClass]);

  // ---- Whether to show qty/unitPrice vs totalValue ----
  const usesQtyPrice = ['br_stock', 'fii', 'intl_stock', 'fi_etf'].includes(form.assetClass);
  const isTransfer = form.operationType === 'transferencia';
  const isSplit = form.operationType === 'desdobramento';

  // ---- Form change handlers ----
  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAssetClassChange = (value) => {
    setForm(prev => ({
      ...prev,
      assetClass: value,
      operationType: '',
      ticker: '',
      assetId: '',
      assetName: '',
      broker: '',
    }));
  };

  const handleAssetSelect = (key) => {
    const asset = availableAssets.find(a => a.key === key);
    if (!asset) return;
    const isTicker = ['br_stock', 'fii', 'intl_stock', 'fi_etf'].includes(form.assetClass);
    setForm(prev => ({
      ...prev,
      ticker: isTicker ? key : '',
      assetId: isTicker ? '' : String(key),
      assetName: asset.label.split(' - ').slice(-1)[0] || asset.label,
      broker: asset.broker || prev.broker,
    }));
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setForm({
      date: tx.date,
      operationType: tx.operationType,
      assetClass: tx.assetClass,
      ticker: tx.ticker || '',
      assetId: tx.assetId || '',
      assetName: tx.assetName || '',
      qty: tx.qty != null ? String(tx.qty) : '',
      unitPrice: tx.unitPrice != null ? String(tx.unitPrice) : '',
      totalValue: tx.totalValue != null ? String(tx.totalValue) : '',
      broker: tx.broker || '',
      brokerDestination: tx.brokerDestination || '',
      fees: tx.fees ? String(tx.fees) : '',
      notes: tx.notes || '',
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingTx(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = toSnakeCase({
      ...form,
      qty: form.qty ? parseFloat(form.qty) : null,
      unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : null,
      totalValue: form.totalValue ? parseFloat(form.totalValue) : null,
      fees: form.fees ? parseFloat(form.fees) : 0,
    }, 'transaction');
    if (editingTx) {
      transactionsCrud.update.mutate({ id: editingTx.id, data: payload });
    } else {
      transactionsCrud.create.mutate(payload);
    }
    setEditingTx(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    transactionsCrud.remove.mutate(id);
  };

  // ---- Filtered transactions ----
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterOp) list = list.filter(t => t.operationType === filterOp);
    if (filterClass) list = list.filter(t => t.assetClass === filterClass);
    return list;
  }, [transactions, filterOp, filterClass]);

  // ---- Summary cards ----
  const summary = useMemo(() => {
    let totalBuys = 0;
    let totalSells = 0;
    let totalFees = 0;
    for (const t of filtered) {
      const val = t.totalValue || ((t.qty || 0) * (t.unitPrice || 0));
      if (['compra', 'aporte'].includes(t.operationType)) totalBuys += val;
      if (['venda', 'resgate'].includes(t.operationType)) totalSells += val;
      totalFees += t.fees || 0;
    }
    return { totalBuys, totalSells, totalFees };
  }, [filtered]);

  // ---- Render ----
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
            <ArrowLeftRight size={22} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Lancamentos</h2>
            <p className="text-xs text-slate-500">Registro de movimentacoes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={b3Import.preview.isPending}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {b3Import.preview.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            Importar B3
          </button>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelForm();
              } else {
                setEditingTx(null);
                setForm(EMPTY_FORM);
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancelar' : 'Novo Lancamento'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${GLASS} p-5`}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Total Compras / Aportes</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalBuys, currency, exchangeRate)}</p>
        </div>
        <div className={`${GLASS} p-5`}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Total Vendas / Resgates</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.totalSells, currency, exchangeRate)}</p>
        </div>
        <div className={`${GLASS} p-5`}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Total Taxas</p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(summary.totalFees, currency, exchangeRate)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={`${GLASS} p-6 space-y-4`}>
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400 mb-2">
            {editingTx ? `Editar Lancamento #${editingTx.id}` : 'Novo Lancamento'}
          </h3>

          {/* Row 1: Asset Class + Operation Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Classe do Ativo</label>
              <select
                value={form.assetClass}
                onChange={(e) => handleAssetClassChange(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              >
                <option value="" className="bg-slate-800">Selecione...</option>
                {ASSET_CLASSES.map(c => (
                  <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Operacao</label>
              <select
                value={form.operationType}
                onChange={(e) => setField('operationType', e.target.value)}
                required
                disabled={!form.assetClass}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50"
              >
                <option value="" className="bg-slate-800">Selecione...</option>
                {allowedOps.map(o => (
                  <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Asset selector + Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Ativo</label>
              <select
                value={form.ticker || form.assetId}
                onChange={(e) => handleAssetSelect(e.target.value)}
                required
                disabled={!form.assetClass}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50"
              >
                <option value="" className="bg-slate-800">Selecione o ativo...</option>
                {availableAssets.map(a => (
                  <option key={a.key} value={a.key} className="bg-slate-800">{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {/* Row 3: Qty/Price or TotalValue (conditional) */}
          {usesQtyPrice && !isTransfer && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {isSplit ? 'Fator' : 'Quantidade'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form.qty}
                  onChange={(e) => setField('qty', e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  placeholder={isSplit ? 'Ex: 2 (dobra)' : '0'}
                />
              </div>
              {!isSplit && form.operationType !== 'bonificacao' && (
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Preco Unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unitPrice}
                    onChange={(e) => setField('unitPrice', e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          )}

          {!usesQtyPrice && !isTransfer && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Valor Total</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.totalValue}
                onChange={(e) => setField('totalValue', e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Transfer destination */}
          {isTransfer && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Corretora Destino</label>
              <input
                type="text"
                value={form.brokerDestination}
                onChange={(e) => setField('brokerDestination', e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                placeholder="Nome da corretora destino"
              />
            </div>
          )}

          {/* Row 4: Broker + Fees + Notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Corretora</label>
              <input
                type="text"
                value={form.broker}
                onChange={(e) => setField('broker', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                placeholder="Ex: XP, Inter..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Taxas</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.fees}
                onChange={(e) => setField('fees', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Notas</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                placeholder="Observacoes..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={transactionsCrud.create.isPending || transactionsCrud.update.isPending}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {(transactionsCrud.create.isPending || transactionsCrud.update.isPending)
                ? 'Salvando...'
                : editingTx ? 'Salvar Alteracoes' : 'Registrar Lancamento'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className={`${GLASS} px-5 py-3 flex flex-wrap items-center gap-3`}>
        <Filter size={16} className="text-slate-400" />
        <select
          value={filterOp}
          onChange={(e) => setFilterOp(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
        >
          <option value="" className="bg-slate-800">Todas Operacoes</option>
          {OPERATION_TYPES.map(o => (
            <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
          ))}
        </select>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
        >
          <option value="" className="bg-slate-800">Todas Classes</option>
          {ASSET_CLASSES.map(c => (
            <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>
          ))}
        </select>
        {(filterOp || filterClass) && (
          <button
            onClick={() => { setFilterOp(''); setFilterClass(''); }}
            className="ml-auto text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className={`${GLASS} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 font-medium px-5 py-3">Data</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Operacao</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Classe</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Ativo</th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">Qtd</th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">Preco</th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">Valor Total</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Corretora</th>
                <th className="text-right text-slate-400 font-medium px-5 py-3">Taxas</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Notas</th>
                <th className="text-center text-slate-400 font-medium px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => {
                const OpIcon = OP_ICON[t.operationType] || ArrowLeftRight;
                const total = t.totalValue || ((t.qty || 0) * (t.unitPrice || 0));
                return (
                  <tr
                    key={t.id}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                      idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${OP_BADGE[t.operationType] || 'bg-slate-500/15 text-slate-400'}`}>
                        <OpIcon size={12} />
                        {OPERATION_TYPES.find(o => o.value === t.operationType)?.label || t.operationType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {CLASS_LABEL[t.assetClass] || t.assetClass}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-200">{t.ticker || t.assetName}</span>
                      {t.ticker && t.assetName && (
                        <span className="ml-1 text-xs text-slate-500">{t.assetName}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300">
                      {t.qty != null ? (t.operationType === 'desdobramento' ? `${t.qty}x` : t.qty) : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300">
                      {t.unitPrice != null ? formatBRL(t.unitPrice) : '-'}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-200">
                      {total > 0 ? formatCurrency(total, currency, exchangeRate) : '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {t.broker || '-'}
                      {t.brokerDestination && (
                        <span className="text-cyan-400"> &rarr; {t.brokerDestination}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400">
                      {t.fees > 0 ? formatBRL(t.fees) : '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[120px] truncate" title={t.notes || ''}>
                      {t.notes || '-'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(t)}
                          className="rounded p-1 text-slate-500 transition hover:bg-indigo-500/10 hover:text-indigo-400"
                          title="Editar lancamento"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="rounded p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          title="Excluir lancamento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-8 text-center text-sm text-slate-500">
                    Nenhum lancamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* B3 Import Preview Modal */}
      {importPreview && (
        <ImportPreviewModal
          data={importPreview}
          onConfirm={handleImportConfirm}
          onClose={() => setImportPreview(null)}
          isConfirming={b3Import.confirm.isPending}
        />
      )}
    </section>
  );
}
