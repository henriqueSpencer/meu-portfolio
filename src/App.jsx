import { useState, useMemo } from 'react';
import { useApp } from './context/AppContext';
import {
  LayoutDashboard, Target, TrendingUp, Globe, Shield,
  Home, DollarSign, Eye, Calculator, BarChart3,
  BellRing, ArrowLeftRight, RotateCcw, Menu, X, Sprout,
} from 'lucide-react';

// Tabs
import DashboardTab from './components/tabs/DashboardTab';
import AllocationTab from './components/tabs/AllocationTab';
import BrStocksTab from './components/tabs/BrStocksTab';
import IntlStocksTab from './components/tabs/IntlStocksTab';
import FixedIncomeTab from './components/tabs/FixedIncomeTab';
import RealAssetsTab from './components/tabs/RealAssetsTab';
import DividendsTab from './components/tabs/DividendsTab';
import WatchlistTab from './components/tabs/WatchlistTab';
import SimulatorTab from './components/tabs/SimulatorTab';
import PerformanceTab from './components/tabs/PerformanceTab';
import AccumulationTab from './components/tabs/AccumulationTab';

const TABS = [
  { id: 'dashboard', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'allocation', label: 'Alocacao', icon: Target },
  { id: 'br-stocks', label: 'RV Brasil', icon: TrendingUp },
  { id: 'intl-stocks', label: 'RV Exterior', icon: Globe },
  { id: 'fixed-income', label: 'Renda Fixa', icon: Shield },
  { id: 'real-assets', label: 'Imobilizados', icon: Home },
  { id: 'dividends', label: 'Proventos', icon: DollarSign },
  { id: 'accumulation', label: 'Acumulacao', icon: Sprout },
  { id: 'watchlist', label: 'Watchlist', icon: Eye },
  { id: 'simulator', label: 'Simulador', icon: Calculator },
  { id: 'performance', label: 'Rentabilidade', icon: BarChart3 },
];

const TAB_COMPONENTS = {
  'dashboard': DashboardTab,
  'allocation': AllocationTab,
  'br-stocks': BrStocksTab,
  'intl-stocks': IntlStocksTab,
  'fixed-income': FixedIncomeTab,
  'real-assets': RealAssetsTab,
  'dividends': DividendsTab,
  'accumulation': AccumulationTab,
  'watchlist': WatchlistTab,
  'simulator': SimulatorTab,
  'performance': PerformanceTab,
};

function App() {
  const { currency, setCurrency, watchlistAlerts, resetData } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ActiveComponent = TAB_COMPONENTS[activeTab];
  const alertCount = watchlistAlerts.length;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-indigo-400">Dash</span>{' '}
              <span className="text-slate-300">Financeiro</span>
            </h1>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3">
            {/* Watchlist alert badge */}
            {alertCount > 0 && (
              <button
                onClick={() => setActiveTab('watchlist')}
                className="relative flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 transition hover:bg-amber-500/20"
              >
                <BellRing className="h-4 w-4" />
                <span className="hidden sm:inline">{alertCount} alerta{alertCount > 1 ? 's' : ''}</span>
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                  {alertCount}
                </span>
              </button>
            )}

            {/* Currency toggle */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5">
              <button
                onClick={() => setCurrency('BRL')}
                className={`rounded-l-lg px-3 py-1.5 text-sm font-medium transition ${
                  currency === 'BRL'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BRL
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`rounded-r-lg px-3 py-1.5 text-sm font-medium transition ${
                  currency === 'USD'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD
              </button>
            </div>

            {/* Reset data */}
            <button
              onClick={resetData}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              title="Resetar dados para padrão"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* ============ SIDEBAR (desktop) ============ */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 overflow-y-auto border-r border-white/5 bg-[#0b0f1a] lg:block">
          <nav className="flex flex-col gap-1 p-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                  {tab.id === 'watchlist' && alertCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ============ MOBILE NAV (overlay) ============ */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-[57px] h-[calc(100vh-57px)] w-64 overflow-y-auto border-r border-white/10 bg-[#0d1220]">
              <nav className="flex flex-col gap-1 p-3">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                      {tab.id === 'watchlist' && alertCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                          {alertCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* ============ MAIN CONTENT ============ */}
        <main className="min-h-[calc(100vh-57px)] flex-1 overflow-x-hidden p-4 md:p-6">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}

export default App;
