import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Users, UserCheck, Activity, LogOut, Menu, X } from 'lucide-react';
import AdminUsersTab from './tabs/AdminUsersTab';
import AdminMetricsTab from './tabs/AdminMetricsTab';
import AdminLogsTab from './tabs/AdminLogsTab';

const ADMIN_TABS = [
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'approvals', label: 'Aprovacoes', icon: UserCheck },
  { id: 'metrics', label: 'Metricas', icon: BarChart3 },
  { id: 'logs', label: 'Logs', icon: Activity },
];

const TAB_COMPONENTS = {
  users: AdminUsersTab,
  approvals: () => <AdminUsersTab pendingOnly />,
  metrics: AdminMetricsTab,
  logs: AdminLogsTab,
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-indigo-400">Dash</span>{' '}
              <span className="text-slate-300">Admin</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 sm:flex">
              <Users className="h-3.5 w-3.5" />
              {user?.name || user?.email}
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>

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
        {/* Sidebar (desktop) */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 overflow-y-auto border-r border-white/5 bg-[#0b0f1a] lg:block">
          <nav className="flex flex-col gap-1 p-3">
            {ADMIN_TABS.map(tab => {
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
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-[57px] h-[calc(100vh-57px)] w-64 overflow-y-auto border-r border-white/10 bg-[#0d1220]">
              <nav className="flex flex-col gap-1 p-3">
                {ADMIN_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="min-h-[calc(100vh-57px)] flex-1 overflow-x-hidden p-4 md:p-6">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
