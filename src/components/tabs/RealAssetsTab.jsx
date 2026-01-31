import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Home, Car, Package, ToggleLeft, ToggleRight } from 'lucide-react';

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
export default function RealAssetsTab() {
  const { realAssets, setRealAssets, currency, exchangeRate } = useApp();

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
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
          Resumo - Ativos Imobilizados
        </h2>

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
                className={`${GLASS} glass-card-hover p-5 transition-colors`}
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
                    onClick={() => handleToggleInclude(asset.id)}
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
    </section>
  );
}
