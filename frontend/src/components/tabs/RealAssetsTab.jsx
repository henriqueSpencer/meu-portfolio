import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toSnakeCase } from '../../utils/apiHelpers';
import { useClosedPositionMetrics } from '../../hooks/usePortfolio';
import { formatCurrency, formatBRL, formatDate, formatTimeHeld, colorClass } from '../../utils/formatters';
import { Home, Car, Package, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import FormModal, { FormField, FormInput, FormSelect } from '../FormModal';
import ClosedPositionsSection from '../ClosedPositionsSection';

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
  const { realAssets, setRealAssets, currency, exchangeRate,
    createTransaction, realAssetsCrud } = useApp();

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
      const oldVal = editing.estimatedValue || 0;
      const newVal = parsed.estimatedValue;
      const delta = newVal - oldVal;
      setRealAssets((prev) => prev.map((a) => (a.id === editing.id ? parsed : a)));
      if (delta !== 0) {
        await createTransaction({
          date: today,
          operationType: delta > 0 ? 'compra' : 'venda',
          assetClass: 'real_asset',
          assetId: parsed.id,
          assetName: parsed.description,
          totalValue: Math.abs(delta),
          notes: 'Ajuste via aba Imobilizado',
        });
      }
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
    // Mark as closed instead of deleting
    setRealAssets((prev) => prev.map((a) => a.id === editing.id ? { ...a, isClosed: true } : a));
    setModalOpen(false);
  }

  function handlePermanentDelete(asset) {
    setRealAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  // ---- Closed position metrics (lazy) ----
  const [metricsEnabled, setMetricsEnabled] = useState(false);
  const metricsQuery = useClosedPositionMetrics('real_asset', metricsEnabled);

  // ---- Active / Closed split ----
  const activeAssets = useMemo(() => realAssets.filter((a) => !a.isClosed), [realAssets]);
  const closedAssets = useMemo(() => realAssets.filter((a) => a.isClosed), [realAssets]);

  // ---- Derived totals ------------------------------------------------------
  const totalValue = useMemo(
    () => activeAssets.reduce((sum, a) => sum + a.estimatedValue, 0),
    [activeAssets],
  );

  const includedTotal = useMemo(
    () =>
      activeAssets
        .filter((a) => a.includeInTotal)
        .reduce((sum, a) => sum + a.estimatedValue, 0),
    [activeAssets],
  );

  const assetCount = activeAssets.length;

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
          {activeAssets.map((asset) => {
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
      {/* ---- Closed Real Assets ---- */}
      <ClosedPositionsSection
        items={closedAssets}
        title="Ativos Encerrados"
        metrics={metricsQuery.data}
        metricsLoading={metricsQuery.isLoading && metricsEnabled}
        onExpand={() => setMetricsEnabled(true)}
        onPermanentDelete={handlePermanentDelete}
        columns={[
          { label: 'Descricao', align: 'left' },
          { label: 'Tipo', align: 'left' },
          { label: 'Valor Aquisicao', align: 'right' },
          { label: 'Valor Venda', align: 'right' },
          { label: 'Resultado', align: 'right' },
          { label: 'Periodo', align: 'right' },
          { label: 'Tempo', align: 'right' },
        ]}
        renderRow={(item, m) => (
          <>
            <td className="py-2 px-2 text-sm font-bold text-slate-300">{item.description}</td>
            <td className="py-2 px-2 text-sm text-slate-400">{item.type}</td>
            <td className="py-2 px-2 text-sm text-slate-400 text-right tabular-nums whitespace-nowrap">{m ? formatBRL(m.total_cost) : '-'}</td>
            <td className="py-2 px-2 text-sm text-slate-400 text-right tabular-nums whitespace-nowrap">{m ? formatBRL(m.total_proceeds) : '-'}</td>
            <td className={`py-2 px-2 text-sm text-right tabular-nums whitespace-nowrap font-medium ${m ? colorClass(m.total_proceeds - m.total_cost) : 'text-slate-400'}`}>
              {m ? formatBRL(m.total_proceeds - m.total_cost) : '-'}
            </td>
            <td className="py-2 px-2 text-sm text-slate-400 text-right whitespace-nowrap">
              {m?.first_buy_date && m?.last_sell_date ? `${m.first_buy_date.slice(5).replace('-', '/')} - ${m.last_sell_date.slice(5).replace('-', '/')}` : '-'}
            </td>
            <td className="py-2 px-2 text-sm text-slate-400 text-right whitespace-nowrap">
              {m ? formatTimeHeld(m.time_held_days) : '-'}
            </td>
          </>
        )}
      />

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
