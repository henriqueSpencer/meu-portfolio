import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Home, Car, Package, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';

// ---------------------------------------------------------------------------
// Shared glass-card style token (consistent with other tabs)
// ---------------------------------------------------------------------------
const GLASS =
  'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the appropriate Lucide icon component for a given asset type. */
function assetIcon(type) {
  switch (type) {
    case 'Imóvel':
      return Home;
    case 'Veículo':
      return Car;
    default:
      return Package;
  }
}

/** Return a background tint class for the icon badge based on asset type. */
function iconBadgeClass(type) {
  switch (type) {
    case 'Imóvel':
      return 'bg-violet-500/20 text-violet-400';
    case 'Veículo':
      return 'bg-cyan-500/20 text-cyan-400';
    default:
      return 'bg-amber-500/20 text-amber-400';
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const EMPTY_ASSET = {
  description: '', type: 'Imovel', estimatedValue: '', acquisitionDate: '',
  includeInTotal: true,
};

export default function RealAssetsTab() {
  const { realAssets, setRealAssets, currency, exchangeRate } = useApp();

  // ---- CRUD state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ASSET);

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

  function handleSave() {
    const parsed = {
      id: editing ? editing.id : String(Date.now()),
      description: form.description.trim(),
      type: form.type,
      estimatedValue: Number(form.estimatedValue) || 0,
      acquisitionDate: form.acquisitionDate,
      includeInTotal: form.includeInTotal,
    };
    if (!parsed.description) return;
    if (editing) {
      setRealAssets((prev) => prev.map((a) => (a.id === editing.id ? parsed : a)));
    } else {
      setRealAssets((prev) => [...prev, parsed]);
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (!editing) return;
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
                <div className="mb-4 flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badgeCls}`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">
                      {asset.description}
                    </p>
                    <p className="text-xs text-slate-400">{asset.type}</p>
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
          <FormField label="Valor Estimado">
            <FormInput type="number" step="0.01" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))} />
          </FormField>
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
      </FormModal>
    </section>
  );
}
