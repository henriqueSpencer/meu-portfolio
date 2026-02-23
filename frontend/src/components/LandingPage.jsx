import { useState, useEffect, useRef } from 'react';
import {
  BarChart3, LayoutDashboard, Target, TrendingUp, Globe, Shield,
  Home, DollarSign, Eye, Calculator, ArrowLeftRight, Sprout,
  ChevronRight, Database, LineChart, Lock, Zap, ArrowUp, ArrowDown,
  Menu, X,
} from 'lucide-react';
import AuthModal from './AuthModal';

// ─── Feature cards data matching all 12 tabs ────────────────────────────
const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Visao Geral',
    description: 'Patrimonio consolidado, variacao diaria e distribuicao por classe de ativos.',
    source: null,
  },
  {
    icon: Target,
    title: 'Alocacao',
    description: 'Comparativo entre alocacao atual e metas definidas, com sugestoes de aportes.',
    source: null,
  },
  {
    icon: TrendingUp,
    title: 'Renda Variavel BR',
    description: 'Acoes e FIIs com cotacoes em tempo real, valuation Graham e Bazin.',
    source: 'Cotacoes via Yahoo Finance',
  },
  {
    icon: Globe,
    title: 'Renda Variavel Intl',
    description: 'Acoes internacionais com conversao automatica USD/BRL via PTAX.',
    source: 'Cambio via Banco Central (PTAX)',
  },
  {
    icon: Shield,
    title: 'Renda Fixa',
    description: 'Titulos, ETFs e contas com rentabilidade comparada a CDI, Selic e IPCA.',
    source: 'Indicadores via API do Banco Central',
  },
  {
    icon: Home,
    title: 'Imobilizados',
    description: 'Imoveis e bens com acompanhamento de valorizacao e peso na carteira.',
    source: null,
  },
  {
    icon: DollarSign,
    title: 'Proventos',
    description: 'Historico de dividendos, JCP e rendimentos com visao mensal e anual.',
    source: null,
  },
  {
    icon: ArrowLeftRight,
    title: 'Lancamentos',
    description: 'Registro imutavel de compras, vendas, aportes e resgates com calculo automatico de PM.',
    source: null,
  },
  {
    icon: Sprout,
    title: 'Acumulacao',
    description: 'Metas de acumulacao com projecao de aportes e crescimento patrimonial.',
    source: null,
  },
  {
    icon: Eye,
    title: 'Watchlist',
    description: 'Acompanhe ativos de interesse com alertas de preco configuraves.',
    source: 'Cotacoes via Yahoo Finance',
  },
  {
    icon: Calculator,
    title: 'Simulador',
    description: 'Simule cenarios de investimento com diferentes taxas e prazos.',
    source: null,
  },
  {
    icon: LineChart,
    title: 'Rentabilidade',
    description: 'Performance da carteira no tempo, comparada a benchmarks do mercado.',
    source: 'Benchmarks via Banco Central',
  },
];

// ─── Data sources for transparency section ──────────────────────────────
const DATA_SOURCES = [
  {
    name: 'Banco Central do Brasil',
    abbr: 'BCB',
    description: 'Taxas Selic, CDI e IPCA, cambio PTAX e series historicas. API publica gratuita.',
    series: 'Series 11 (Selic), 12 (CDI), 433 (IPCA), 4189 (Selic Meta)',
    url: 'bcb.gov.br',
  },
  {
    name: 'Yahoo Finance',
    abbr: 'YF',
    description: 'Cotacoes de acoes brasileiras (B3) e internacionais em tempo real.',
    series: 'Sufixo .SA para tickers brasileiros',
    url: 'finance.yahoo.com',
  },
  {
    name: 'Metodos de Valuation',
    abbr: 'CALC',
    description: 'Graham (raiz de 22,5 x LPA x VPA) e Bazin (mediana dividendos 5a / 6%).',
    series: 'Formulas classicas de analise fundamentalista',
    url: null,
  },
];

// ─── Animated counter hook ──────────────────────────────────────────────
function useAnimatedCounter(target, duration = 2000, decimals = 0, startOnView = true) {
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  return { value: value.toFixed(decimals), ref };
}

// ─── Scroll reveal hook ─────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ─── Mini sparkline component ───────────────────────────────────────────
function Sparkline({ data, color = '#6366f1', width = 120, height = 40 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Fake data for preview ──────────────────────────────────────────────
const FAKE_PORTFOLIO = [
  { label: 'Acoes BR', value: 42, color: '#6366f1' },
  { label: 'Renda Fixa', value: 28, color: '#8b5cf6' },
  { label: 'FIIs', value: 15, color: '#22d3ee' },
  { label: 'Intl', value: 10, color: '#10b981' },
  { label: 'Caixa', value: 5, color: '#f59e0b' },
];

const FAKE_STOCKS = [
  { ticker: 'PETR4', price: 38.72, change: 2.4, data: [34, 35.5, 36, 34.8, 37, 36.5, 38, 37.5, 38.72] },
  { ticker: 'VALE3', price: 61.15, change: -1.2, data: [64, 63, 62.5, 63.5, 62, 61.8, 62, 61.5, 61.15] },
  { ticker: 'ITUB4', price: 32.50, change: 0.8, data: [31, 31.5, 32, 31.8, 32.2, 31.9, 32.3, 32.1, 32.5] },
  { ticker: 'WEGE3', price: 44.30, change: 1.5, data: [41, 41.5, 42.5, 43, 42.8, 43.5, 43.8, 44, 44.3] },
];

const FAKE_CDI_SERIES = [100, 100.8, 101.5, 102.1, 103, 103.8, 104.5, 105.3, 106.2, 107, 107.9, 108.8];

// ─── Main component ─────────────────────────────────────────────────────
export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0f1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-indigo-400">Dash</span>{' '}
              <span className="text-slate-300">Financeiro</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <a href="#features" className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-white">
              Funcionalidades
            </a>
            <a href="#preview" className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-white">
              Preview
            </a>
            <a href="#sources" className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-white">
              Fontes
            </a>
            <button
              onClick={() => openAuth('login')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Entrar
            </button>
            <button
              onClick={() => openAuth('register')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Criar conta
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 sm:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#0b0f1a]/95 px-4 pb-4 pt-2 sm:hidden">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Funcionalidades
            </a>
            <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Preview
            </a>
            <a href="#sources" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Fontes
            </a>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => openAuth('login')}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                Entrar
              </button>
              <button
                onClick={() => openAuth('register')}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Criar conta
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <HeroSection onOpenAuth={openAuth} />

      {/* ── Features Section ───────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Preview Section ────────────────────────────────────── */}
      <PreviewSection />

      {/* ── Data Sources Section ───────────────────────────────── */}
      <DataSourcesSection />

      {/* ── Footer ─────────────────────────────────────────────── */}
      <Footer onOpenAuth={openAuth} />

      {/* ── Auth Modal ─────────────────────────────────────────── */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────
function HeroSection({ onOpenAuth }) {
  const patrimonio = useAnimatedCounter(847250, 2500, 0, false);
  const rentabilidade = useAnimatedCounter(18.7, 2000, 1, false);

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-20 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-purple-600/8 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
            <Zap className="h-3.5 w-3.5" />
            Dashboard pessoal de investimentos
          </div>

          {/* Headline */}
          <h1 className="mb-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Seus investimentos,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              uma visao completa
            </span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Acompanhe renda variavel, renda fixa, dividendos e metas de alocacao
            em um unico lugar. Dados atualizados via Banco Central e Yahoo Finance.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="group flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Comecar agora
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a
              href="#preview"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-slate-300 transition hover:bg-white/10"
            >
              Ver preview
            </a>
          </div>

          {/* Animated stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white sm:text-3xl">12</div>
              <div className="mt-1 text-sm text-slate-500">Modulos</div>
            </div>
            <div className="text-center" ref={patrimonio.ref}>
              <div className="text-2xl font-bold text-white sm:text-3xl">
                R$ {Number(patrimonio.value).toLocaleString('pt-BR')}
              </div>
              <div className="mt-1 text-sm text-slate-500">Exemplo de portfolio</div>
            </div>
            <div className="text-center" ref={rentabilidade.ref}>
              <div className="text-2xl font-bold text-emerald-400 sm:text-3xl">
                +{rentabilidade.value}%
              </div>
              <div className="mt-1 text-sm text-slate-500">Rent. simulada 12m</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white sm:text-3xl">100%</div>
              <div className="mt-1 text-sm text-slate-500">Gratuito</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────────────────
function FeaturesSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="features" className="scroll-reveal px-4 py-20 sm:px-6" ref={sectionRef}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que voce precisa para{' '}
            <span className="text-indigo-400">gerenciar sua carteira</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            12 modulos especializados cobrindo todas as classes de ativos,
            com calculos automaticos e dados de mercado em tempo real.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass-card glass-card-hover group rounded-xl p-5 transition"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-400 transition group-hover:bg-indigo-600/25">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-200">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feat.description}</p>
                {feat.source && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <Database className="h-3 w-3" />
                    {feat.source}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Preview ────────────────────────────────────────────────────────────
function PreviewSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="preview" className="scroll-reveal px-4 py-20 sm:px-6" ref={sectionRef}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Veja como funciona
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Interface intuitiva com dados simulados. Todos os numeros abaixo sao ficticios, apenas para demonstracao.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Allocation donut (left) */}
          <div className="glass-card rounded-xl p-6 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-slate-400">Alocacao da Carteira</h3>
            <div className="flex items-center justify-center">
              <AllocationDonut data={FAKE_PORTFOLIO} />
            </div>
            <div className="mt-4 space-y-2">
              {FAKE_PORTFOLIO.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-400">{item.label}</span>
                  </div>
                  <span className="font-medium text-slate-300">{item.value}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-600">
              Dados ilustrativos - sua alocacao sera calculada com base nos ativos cadastrados
            </div>
          </div>

          {/* Stocks + CDI (right) */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* Stock tickers */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-400">Cotacoes em Tempo Real</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FAKE_STOCKS.map((stock) => (
                  <div key={stock.ticker} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="mb-1 text-xs font-bold text-slate-300">{stock.ticker}</div>
                    <div className="text-lg font-semibold text-white">
                      {stock.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stock.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </div>
                    <div className="mt-2">
                      <Sparkline
                        data={stock.data}
                        color={stock.change >= 0 ? '#10b981' : '#ef4444'}
                        width={80}
                        height={28}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-600">
                Precos fictcios para demonstracao. Dados reais via Yahoo Finance (delay ~15min)
              </div>
            </div>

            {/* CDI benchmark chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="mb-1 text-sm font-semibold text-slate-400">Rentabilidade vs CDI</h3>
              <p className="mb-4 text-xs text-slate-600">
                Comparativo do sistema de cotas com benchmarks do Banco Central (series 12 CDI, 11 Selic)
              </p>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Sparkline data={FAKE_CDI_SERIES} color="#6366f1" width={320} height={60} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-400">+8,8%</div>
                  <div className="text-xs text-slate-500">12 meses</div>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 rounded bg-indigo-500" />
                  Carteira (cotas)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 rounded bg-slate-600" />
                  CDI acumulado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Allocation donut SVG ───────────────────────────────────────────────
function AllocationDonut({ data }) {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((item) => {
        const dashLength = (item.value / 100) * circumference;
        const dashOffset = -(cumulative / 100) * circumference;
        cumulative += item.value;
        return (
          <circle
            key={item.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-1000"
          />
        );
      })}
      <text x="50%" y="47%" textAnchor="middle" className="fill-white text-lg font-bold">
        R$ 847k
      </text>
      <text x="50%" y="60%" textAnchor="middle" className="fill-slate-500 text-[10px]">
        patrimonio total
      </text>
    </svg>
  );
}

// ─── Data Sources ───────────────────────────────────────────────────────
function DataSourcesSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="sources" className="scroll-reveal px-4 py-20 sm:px-6" ref={sectionRef}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Transparencia nos{' '}
            <span className="text-indigo-400">dados e calculos</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Todas as fontes de dados e metodologias de calculo sao abertas.
            Nenhuma informacao sensivel e armazenada em terceiros.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {DATA_SOURCES.map((src) => (
            <div key={src.abbr} className="glass-card rounded-xl p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/15 text-purple-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{src.name}</h3>
                  {src.url && (
                    <span className="text-xs text-slate-600">{src.url}</span>
                  )}
                </div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-slate-400">{src.description}</p>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-500">
                {src.series}
              </div>
            </div>
          ))}
        </div>

        {/* Calculation transparency */}
        <div className="mt-8 glass-card rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-600/15 text-cyan-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-200">Como os calculos funcionam</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                O sistema de <strong className="text-slate-300">cotas</strong> normaliza aportes e resgates para calcular
                rentabilidade real, similar a fundos de investimento. O preco medio e atualizado automaticamente
                a cada transacao (compra, venda, desdobramento, bonificacao). Valuation Graham usa{' '}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-indigo-400">raiz(22,5 x LPA x VPA)</code>,
                e Bazin usa{' '}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-indigo-400">mediana(div 5a) / 6%</code>.
                Alocacao considera ETFs de renda fixa na classe "Renda Fixa" e contas correntes em "Caixa".
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────
function Footer({ onOpenAuth }) {
  return (
    <footer className="border-t border-white/5 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold">
                <span className="text-indigo-400">Dash</span>{' '}
                <span className="text-slate-400">Financeiro</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-slate-600">
              Dashboard pessoal para acompanhamento de investimentos.
              Dados publicos, codigo aberto, sem custos.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              Entrar
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Criar conta
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs leading-relaxed text-slate-600">
          <p>
            Este dashboard e uma ferramenta pessoal de acompanhamento. Nao constitui recomendacao de investimento.
          </p>
          <p className="mt-1">
            Cotacoes: Yahoo Finance (delay ~15min) | Indicadores: Banco Central do Brasil (API publica) |
            Cambio: PTAX (BCB)
          </p>
        </div>
      </div>
    </footer>
  );
}
