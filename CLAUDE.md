# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint check across the project
- `npm run preview` — Preview production build locally

No test framework is configured yet.

## Stack

- **React 19** with JSX (no TypeScript)
- **Vite 7** with `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (configured in `index.css` with `@import "tailwindcss"` and `@theme` block)
- **Recharts 3** for all charts (pie, bar, line, area)
- **Lucide React** for icons

## Architecture

This is a personal investment tracking dashboard. All data is currently mock (no backend). The app is structured as a single-page tab-based interface.

### Data flow

`src/data/mockData.js` → `src/context/AppContext.jsx` → tab components

1. **mockData.js** exports all portfolio data: BR stocks, FIIs, international stocks, fixed income, real assets, dividend history, watchlist, allocation targets, patrimonial history, benchmarks, and chart color constants.
2. **AppContext.jsx** wraps the app via `AppProvider` in `main.jsx`. It loads data from `localStorage` (key: `dash_financeiro_data`) on init, falling back to mock defaults. Every state setter triggers a `useEffect` that persists to `localStorage`. Derived values (allocation percentages, total patrimony, dividend summaries, watchlist alerts) are computed via `useMemo`. Access state via the `useApp()` hook.
3. **Tab components** consume context via `useApp()` and are rendered by `App.jsx` based on the active tab.

### Key conventions

- **Glass-card styling**: Most tab components define a local `GLASS` constant (`'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md'`). There is also a `.glass-card` CSS class in `index.css` for the same effect. Either can be used.
- **Currency formatting**: All monetary display goes through `formatCurrency(value, currency, exchangeRate)` from `src/utils/formatters.js`, which respects the global BRL/USD toggle. Use `formatBRL` or `formatUSD` for currency-specific formatting.
- **Financial calculations**: `src/utils/calculations.js` contains Graham fair price (`sqrt(22.5 * LPA * VPA)`), Bazin fair price (`median dividends / 0.06`), discount/premium indicators, yield on cost, allocation calculation, and contribution suggestion logic.
- **Dark mode only**: The app is dark-mode-only. Background is `#0b0f1a`, text is `#e2e8f0`. Accent colors: indigo `#6366f1`, purple `#8b5cf6`, cyan `#22d3ee`. Semantic colors: positive `#10b981` (emerald), negative `#ef4444` (red), warning `#f59e0b` (amber).
- **Recharts tooltips**: Custom tooltip components use the glass-card style. The global `.recharts-default-tooltip` override in `index.css` applies dark background to all Recharts tooltips.

### Tab routing

`App.jsx` maps tab IDs to components via a `TAB_COMPONENTS` object. Navigation is state-driven (`useState`) — no router. The sidebar renders on `lg:` breakpoints; mobile uses an overlay menu.

### ESLint

The `no-unused-vars` rule ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`), which allows unused icon imports and component-level constants.

### Placeholders for future integration

- `exchangeRate` is hardcoded as `EXCHANGE_RATE = 6.05` in mockData. Ready to be replaced by an API call.
- Cripto and Reserva Emergencia classes exist in `calculateAllocation` but are set to 0 — ready for data.
- The `brokerFilter` state exists in context but is only used in BrStocksTab and IntlStocksTab.
