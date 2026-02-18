import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toSnakeCase } from '../../utils/apiHelpers';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Home, Car, Gem, ToggleLeft, ToggleRight, Plus, ShoppingCart, TrendingDown, X } from 'lucide-react';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

// ---------------------------------------------------------------------------
// Shared glass-card style token (consistent with other tabs)
// ---------------------------------------------------------------------------
const GLASS =
  'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map stored type values to display labels with proper Portuguese. */
const TYPE_LABELS = { Imovel: 'Imovel', Veiculo: 'Veiculo', Outro: 'Outro' };

/** Return the appropriate Lucide icon component for a given asset type. */
function assetIcon(type) {
  switch (type) {
    case 'Imovel':
      return Home;
    case 'Veiculo':
      return Car;
    default:
      return Gem;
  }
}

/** Return a background tint class for the icon badge based on asset type. */
function iconBadgeClass(type) {
  switch (type) {
    case 'Imovel':
      return 'bg-violet-500/20 text-violet-400';
    case 'Veiculo':
      return 'bg-cyan-500/20 text-cyan-400';
    default:
      return 'bg-amber-500/20 text-amber-400';
  }
}

// ---------------------------------------------------------------------------
// Buy / Sell Sub-Modal
// ---------------------------------------------------------------------------
function BuySellModal({ isOpen, onClose, mode, asset, onConfirm }) {
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!isOpen || !asset) return null;

  const isBuy = mode === 'compra';
  const title = isBuy ? 'Registrar Compra' : 'Registrar Venda';
  const maxSell = asset.estimatedValue || 0;
  const numValue = Number(value) || 0;
  const isFullSale = !isBuy && numValue > 0 && numValue >= maxSell;

  function handleConfirm() {
    if (numValue <= 0) return;
    if (!isBuy && numValue > maxSell) return;
    onConfirm({ value: numValue, date, notes: notes.trim(), deleteAsset: isFullSale });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="glass-card relative z-10 mx-4 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            {isBuy ? (
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-slate-400">
            {asset.description}
            {!isBuy && (
              <span className="ml-2 text-xs text-slate-500">
                (Valor atual: {formatCurrency(maxSell, 'BRL', 1)})
              </span>
            )}
          </p>

          <FormField label="Valor da Operacao">
            <FormInput
              type="number"
              step="0.01"
              min="0"
              max={!isBuy ? maxSell : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </FormField>

          <FormField label="Data">
            <FormInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>

          <FormField label="Notas (opcional)">
            <FormInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descricao da operacao..."
            />
          </FormField>

          {isFullSale && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              Venda total detectada. O ativo sera excluido apos a confirmacao.
            </div>
          )}

          {!isBuy && numValue > maxSell && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              O valor de venda nao pode exceder o valor atual do ativo.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={numValue <= 0 || (!isBuy && numValue > maxSell)}
            className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
              isBuy
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isBuy ? 'Confirmar Compra' : 'Confirmar Venda'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const EMPTY_ASSET = {
  description: '', type: 'Imovel', estimatedValue: '', acquisitionDate: '',
  includeInTotal: true,
};

export default function RealAssetsTab() {
  const { realAssets, setRealAssets, currency, exchangeRate,
    createTransaction, realAssetsCrud } = useApp();

  // ---- CRUD state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ASSET);

  // ---- Buy/Sell sub-modal state ----
  const [buySellOpen, setBuySellOpen] = useState(false);
  const [buySellMode, setBuySellMode] = useState('compra');
  const [buySellAsset, setBuySellAsset] = useState(null);

  function handleAdd() {
    setEditing(null);
    setForm(EMPTY_ASSET);
    setModalOpen(true);
  }

  function handleEdit(asset) {
    setEditing(asset);
    setForm({
      description: asset.description,
      type: asset.type,
      estimatedValue: String(asset.estimatedValue),
      acquisitionDate: asset.acquisitionDate || '',
      includeInTotal: asset.includeInTotal,
    });
    setModalOpen(true);
  }

  function openBuySell(asset, mode, e) {
    if (e) e.stopPropagation();
    setBuySellAsset(asset);
    setBuySellMode(mode);
    setBuySellOpen(true);
  }

  async function handleBuySellConfirm({ value, date, notes, deleteAsset }) {
    const asset = buySellAsset;
    const isBuy = buySellMode === 'compra';

    await createTransaction({
      date,
      operationType: buySellMode,
      assetClass: 'real_asset',
      assetId: asset.id,
      assetName: asset.description,
      totalValue: value,
      notes: notes || (isBuy ? 'Compra via aba Imobilizado' : 'Venda via aba Imobilizado'),
    });

    if (deleteAsset) {
      setRealAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } else {
      const newValue = isBuy
        ? (asset.estimatedValue || 0) + value
        : (asset.estimatedValue || 0) - value;
      setRealAssets((prev) =>
        prev.map((a) =>
          a.id === asset.id ? { ...a, estimatedValue: Math.max(0, newValue) } : a,
        ),
      );
    }

    setBuySellOpen(false);
    setModalOpen(false);
  }

  async function handleSave() {
    const parsed = {
      id: editing ? editing.id : String(Date.now()),
      description: form.description.trim(),
      type: form.type,
      estimatedValue: Number(form.estimatedValue) || 0,
      acquisitionDate: form.acquisitionDate,
      includeInTotal: form.includeInTotal,
    };
    if (!parsed.description) return;
    const today = new Date().toISOString().slice(0, 10);
    if (editing) {
      // Edit mode: only save metadata (description, type, date, includeInTotal)
      // Value changes are handled via explicit buy/sell flow
      setRealAssets((prev) =>
        prev.map((a) =>
          a.id === editing.id
            ? { ...a, description: parsed.description, type: parsed.type, acquisitionDate: parsed.acquisitionDate, includeInTotal: parsed.includeInTotal }
            : a,
        ),
      );
    } else {
      const assetData = { ...parsed, estimatedValue: 0 };
      await realAssetsCrud.create.mutateAsync(toSnakeCase(assetData, 'realAsset'));
      if (parsed.estimatedValue > 0) {
        await createTransaction({
          date: today,
          operationType: 'compra',
          assetClass: 'real_asset',
          assetId: parsed.id,
          assetName: parsed.description,
          totalValue: parsed.estimatedValue,
          notes: 'Posicao inicial via aba Imobilizado',
        });
      }
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!editing) return;
    if ((editing.estimatedValue || 0) > 0) {
      const today = new Date().toISOString().slice(0, 10);
      await createTransaction({
        date: today,
        operationType: 'venda',
        assetClass: 'real_asset',
        assetId: editing.id,
        assetName: editing.description,
        totalValue: editing.estimatedValue,
        notes: 'Encerramento via aba Imobilizado',
      });
    }
    setRealAssets((prev) => prev.filter((a) => a.id !== editing.id));
    setModalOpen(false);
  }

  // ---- Derived totals ------------------------------------------------------
  const totalValue = useMemo(
    () => realAssets.reduce((sum, a) => sum + a.estimatedValue, 0),
    [realAssets],
  );

  const includedTotal = useMemo(
    () =>
      realAssets
        .filter((a) => a.includeInTotal)
        .reduce((sum, a) => sum + a.estimatedValue, 0),
    [realAssets],
  );

  const assetCount = realAssets.length;

  // ---- Handlers ------------------------------------------------------------
  function handleToggleInclude(id) {
    setRealAssets((prev) =>
      prev.map((asset) =>
        asset.id === id
          ? { ...asset, includeInTotal: !asset.includeInTotal }
          : asset,
      ),
    );
  }

  // ---- Render --------------------------------------------------------------
  return (
    <section className="space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Summary Card                                                      */}
      {/* ------------------------------------------------------------------- */}
      <div className={`${GLASS} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Resumo - Ativos Imobilizados
          </h2>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Ativo
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total value */}
          <div className={`${GLASS} p-4`}>
            <p className="mb-1 text-xs text-slate-400">Valor Total</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(totalValue, currency, exchangeRate)}
            </p>
          </div>

          {/* Included in patrimony */}
          <div className={`${GLASS} p-4`}>
            <p className="mb-1 text-xs text-slate-400">
              Incluido no Patrimonio
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(includedTotal, currency, exchangeRate)}
            </p>
          </div>

          {/* Asset count */}
          <div className={`${GLASS} p-4`}>
            <p className="mb-1 text-xs text-slate-400">Total de Ativos</p>
            <p className="text-xl font-bold text-white">{assetCount}</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Assets Grid                                                       */}
      {/* ------------------------------------------------------------------- */}
      {assetCount === 0 ? (
        <div
          className={`${GLASS} flex h-40 items-center justify-center text-sm text-slate-500`}
        >
          Nenhum ativo imobilizado cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {realAssets.map((asset) => {
            const Icon = assetIcon(asset.type);
            const badgeCls = iconBadgeClass(asset.type);
            const included = asset.includeInTotal;

            return (
              <div
                key={asset.id}
                onClick={() => handleEdit(asset)}
                className={`${GLASS} glass-card-hover p-5 transition-colors cursor-pointer`}
              >
                {/* Card header: icon + description */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badgeCls}`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-white">
                        {asset.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        {TYPE_LABELS[asset.type] || asset.type}
                      </p>
                    </div>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => openBuySell(asset, 'compra', e)}
                      title="Registrar Compra"
                      className="rounded-lg p-1.5 text-emerald-400/60 transition hover:bg-emerald-500/15 hover:text-emerald-400"
                    >
                      <ShoppingCart size={16} />
                    </button>
                    <button
                      onClick={(e) => openBuySell(asset, 'venda', e)}
                      title="Registrar Venda"
                      className="rounded-lg p-1.5 text-red-400/60 transition hover:bg-red-500/15 hover:text-red-400"
                    >
                      <TrendingDown size={16} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Valor Estimado
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(
                        asset.estimatedValue,
                        currency,
                        exchangeRate,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Data de Aquisicao
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatDate(asset.acquisitionDate)}
                    </p>
                  </div>
                </div>

                {/* Toggle: include / exclude from patrimony */}
                <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggleInclude(asset.id); }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
                    aria-pressed={included}
                    aria-label={
                      included
                        ? 'Excluir do patrimonio'
                        : 'Incluir no patrimonio'
                    }
                  >
                    {included ? (
                      <ToggleRight
                        size={28}
                        className="text-emerald-400"
                      />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-500" />
                    )}
                  </button>

                  <span
                    className={`text-xs ${
                      included ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {included
                      ? 'Incluido no patrimonio'
                      : 'Excluido do patrimonio'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- CRUD Modal ---- */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${editing.description}` : 'Adicionar Ativo Imobilizado'}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        saveLabel={editing ? 'Salvar Dados' : 'Salvar'}
      >
        <FormField label="Descricao">
          <FormInput value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Apartamento 2Q - Belo Horizonte" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo">
            <FormSelect value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="Imovel">Imovel</option>
              <option value="Veiculo">Veiculo</option>
              <option value="Outro">Outro</option>
            </FormSelect>
          </FormField>
          {!editing && (
            <FormField label="Valor Inicial">
              <FormInput type="number" step="0.01" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))} />
            </FormField>
          )}
          {editing && (
            <FormField label="Valor Atual">
              <div className="flex items-center h-[38px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-400">
                {formatCurrency(editing.estimatedValue, 'BRL', 1)}
              </div>
            </FormField>
          )}
        </div>
        <FormField label="Data de Aquisicao">
          <FormInput type="date" value={form.acquisitionDate} onChange={(e) => setForm((f) => ({ ...f, acquisitionDate: e.target.value }))} />
        </FormField>
        <FormField label="Incluir no Patrimonio">
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, includeInTotal: !f.includeInTotal }))}
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
            >
              {form.includeInTotal ? (
                <ToggleRight size={28} className="text-emerald-400" />
              ) : (
                <ToggleLeft size={28} className="text-slate-500" />
              )}
            </button>
            <span className={`text-xs ${form.includeInTotal ? 'text-emerald-400' : 'text-slate-500'}`}>
              {form.includeInTotal ? 'Sim' : 'Nao'}
            </span>
          </div>
        </FormField>

        {/* Buy/Sell action buttons (only in edit mode) */}
        {editing && (
          <div className="border-t border-white/10 pt-4 mt-2">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              Operacoes
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => openBuySell(editing, 'compra')}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <ShoppingCart size={16} /> Registrar Compra
              </button>
              <button
                type="button"
                onClick={() => openBuySell(editing, 'venda')}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                <TrendingDown size={16} /> Registrar Venda
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* ---- Buy/Sell Sub-Modal ---- */}
      <BuySellModal
        isOpen={buySellOpen}
        onClose={() => setBuySellOpen(false)}
        mode={buySellMode}
        asset={buySellAsset}
        onConfirm={handleBuySellConfirm}
      />
    </section>
  );
}
