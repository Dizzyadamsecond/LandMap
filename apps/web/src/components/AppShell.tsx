'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, type ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Award,
  BarChart,
  Bell,
  BellRing,
  BookA,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  Code2,
  CreditCard,
  Eye,
  FileText,
  Flame,
  GitCompare,
  Layers,
  LayoutGrid,
  LineChart,
  Link2,
  ListChecks,
  Lock,
  Menu,
  Map,
  MapPin,
  MapPinned,
  MessageSquare,
  PenLine,
  Plug,
  Radio,
  RefreshCw,
  Satellite,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  Wand2,
  Workflow,
  X,
} from './lovable/icons';
import { Tooltip, OnboardingTour, type TourStep, cn } from '@landmap/ui';
import { CommandPaletteHost } from './CommandPaletteHost';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

function CameraGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

// Ordem 1:1 com a Lovable (NAV literal da sidebar fina icon-only 68px):
// Mapa → Dashboard → Comparador → Favoritos → Alertas → Relatórios → IA LandMap → Configurações.
const lovableNavItems: { href: string; label: string; Icon: IconComponent; tour?: string }[] = [
  { href: 'map', label: 'Mapa', Icon: Map, tour: 'map' },
  { href: 'dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: 'compare', label: 'Comparador', Icon: GitCompare },
  { href: 'favorites', label: 'Favoritos', Icon: Star },
  { href: 'alerts', label: 'Alertas', Icon: Bell },
  { href: 'reports', label: 'Relatórios', Icon: BarChart },
  { href: 'assistant', label: 'IA LandMap', Icon: Sparkles },
  { href: 'settings', label: 'Configurações', Icon: Settings },
];

export interface NavCategory {
  title: string;
  items: { href: string; label: string; Icon: IconComponent; emBreve?: boolean }[];
}

// Categorias organizadas semanticamente para a gaveta flutuante "Mais Recursos"
const extraCategories: NavCategory[] = [
  {
    title: 'Inteligência & Mercado',
    items: [
      { href: 'regions', label: 'Regiões', Icon: MapPin },
      { href: 'insights', label: 'Insights', Icon: BellRing },
      { href: 'heatmap', label: 'Heatmap', Icon: Flame },
      { href: 'market', label: 'Mercado', Icon: LineChart },
      { href: 'market-index', label: 'Índice Regional', Icon: TrendingUp },
      { href: 'neighborhoods', label: 'Bairros', Icon: MapPin },
      { href: 'cities', label: 'Cidades', Icon: Building2 },
      { href: 'cobertura', label: 'Cobertura', Icon: Satellite },
      { href: 'terrenos', label: 'Terrenos', Icon: MapPinned },
      { href: 'zoning', label: 'Zoneamento', Icon: Layers },
      { href: 'valorization', label: 'Valorização', Icon: TrendingUp },
      { href: 'viabilidade', label: 'Viabilidade Construtiva', Icon: Activity },
      { href: 'underwriting', label: 'Underwriting & Estresse', Icon: Activity },
      { href: 'risk-radar', label: 'Radar de Risco', Icon: AlertTriangle },
    ],
  },
  {
    title: 'Ferramentas & Análise',
    items: [
      { href: 'calculator', label: 'Calculadora', Icon: PenLine },
      { href: 'compare/opportunities', label: 'Comparar Oportunidades', Icon: ArrowLeftRight },
      { href: 'copilot', label: 'IA Field Copilot Scanner', Icon: CameraGlyph },
      { href: 'inspect', label: 'Inspecionar', Icon: Eye },
      { href: 'kpis', label: 'KPIs', Icon: BarChart },
      { href: 'live', label: 'Ao Vivo', Icon: Radio },
      { href: 'pipeline', label: 'Pipeline', Icon: Workflow },
      { href: 'radar', label: 'Radar', Icon: Radio },
      { href: 'rag', label: 'RAG', Icon: Sparkles },
      { href: 'recommendations', label: 'Recomendações', Icon: Sparkles },
      { href: 'studio', label: 'Studio', Icon: Wand2 },
      { href: 'workflows', label: 'Workflows', Icon: Workflow },
      { href: 'world', label: 'Mundo 3D', Icon: MapPinned },
      { href: 'world-3d', label: 'Mundo 3D (Beta)', Icon: MapPinned },
      { href: 'writer', label: 'Redator', Icon: PenLine },
    ],
  },
  {
    title: 'Negócios & Investimento',
    items: [
      { href: 'consorcio', label: 'Consórcio', Icon: Briefcase },
      { href: 'investment-memo', label: 'Investment Memo', Icon: FileText },
      { href: 'investor', label: 'Investidor', Icon: Briefcase },
      { href: 'leads', label: 'Leads', Icon: Users },
      { href: 'plans', label: 'Planos', Icon: Briefcase },
      { href: 'plans/manage', label: 'Gestão de Planos', Icon: CreditCard },
      { href: 'portfolio', label: 'Portfólio', Icon: Briefcase },
      { href: 'pricing', label: 'Preços', Icon: CreditCard },
      { href: 'sales', label: 'Vendas', Icon: TrendingUp },
      { href: 'syndicate', label: 'Sindicatos LPs', Icon: Briefcase },
      { href: 'warroom', label: 'War Room', Icon: AlertTriangle },
      { href: 'watchlist', label: 'Watchlist', Icon: Star },
    ],
  },
  {
    title: 'Desenvolvedores & Operação',
    items: [
      { href: 'activity', label: 'Atividade', Icon: RefreshCw },
      { href: 'agents', label: 'Agentes', Icon: Bot },
      { href: 'api-keys', label: 'API Keys', Icon: Lock },
      { href: 'automations', label: 'Automações', Icon: Workflow },
      { href: 'chat', label: 'Chat', Icon: MessageSquare },
      { href: 'checkout', label: 'Checkout', Icon: CreditCard },
      { href: 'cockpit', label: 'Cockpit', Icon: Radio },
      { href: 'developers', label: 'Developers', Icon: Code2 },
      { href: 'developers/api-reference', label: 'API Reference', Icon: Code2 },
      { href: 'docs', label: 'Documentação', Icon: BookOpen },
      { href: 'docs/embedding', label: 'Embeddings', Icon: BookA },
      { href: 'fontes', label: 'Fontes', Icon: Link2 },
      { href: 'glossary', label: 'Glossário', Icon: BookOpen },
      { href: 'integrations', label: 'Integrações', Icon: Plug },
      { href: 'knowledge', label: 'Knowledge Base', Icon: BookOpen },
      { href: 'launch', label: 'Lançamento', Icon: Sparkles },
      { href: 'notifications', label: 'Notificações', Icon: Bell },
      { href: 'resources', label: 'Recursos', Icon: BookOpen },
      { href: 'status', label: 'Status', Icon: Activity },
      { href: 'team', label: 'Time', Icon: Users },
      { href: 'v2', label: 'v2 (Preview)', Icon: Sparkles },
    ],
  },
  {
    title: 'Institucional & Legal',
    items: [
      { href: 'profile', label: 'Perfil', Icon: User },
      { href: 'onboarding', label: 'Onboarding', Icon: ArrowRight },
      { href: 'sobre', label: 'Sobre', Icon: FileText },
      { href: 'metodologia', label: 'Metodologia', Icon: Layers },
      { href: 'aviso-legal', label: 'Aviso Legal', Icon: ShieldCheck },
      { href: 'privacy', label: 'Privacidade', Icon: Lock },
      { href: 'terms', label: 'Termos', Icon: FileText },
      { href: 'cookies', label: 'Cookies', Icon: ShieldCheck },
      { href: 'admin', label: 'Painel Admin', Icon: Settings },
    ],
  },
];

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="search"]',
    title: 'Busca global',
    description:
      'Digite cidades, bairros ou imóveis e pressione Enter. A qualquer momento, use ⌘K / Ctrl+K para abrir o atalho de navegação.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="map"]',
    title: 'Mapa de valorização',
    description:
      'Veja o preço por m², heatmaps de valorização e camadas por região em tempo real.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav"]',
    title: 'Navegação completa',
    description:
      'Acesse os principais módulos da plataforma diretamente na sidebar ou abra o menu de recursos extras.',
    placement: 'right',
  },
  {
    target: '[data-tour="admin"]',
    title: 'Painel Admin & Agentes de IA',
    description:
      'CRM, cockpits e agentes autônomos de follow-up ficam aqui — o centro de operação do seu time.',
    placement: 'right',
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params.locale as string) || 'pt-BR';
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const [drawerFilter, setDrawerFilter] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [tourOpen, setTourOpen] = useState(false);

  const isActive = (href: string) => {
    const full = `/${locale}/${href}`;
    return pathname === full || pathname.startsWith(full + '/');
  };

  const bottomItems = lovableNavItems.filter((item) =>
    ['map', 'dashboard', 'compare', 'alerts', 'assistant'].includes(item.href),
  );

  const filteredCategories = useMemo(() => {
    if (!drawerFilter.trim()) return extraCategories;
    const q = drawerFilter.toLowerCase();
    return extraCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [drawerFilter]);

  // Dispara o tour de boas-vindas apenas na primeira visita (desktop).
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches) {
        if (!localStorage.getItem('landmap:tour_done')) {
          const t = setTimeout(() => setTourOpen(true), 600);
          return () => clearTimeout(t);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fecha os drawers ao trocar de rota.
  useEffect(() => {
    setExtraMenuOpen(false);
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Fecha drawers com Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
        setExtraMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = () => {
    const q = searchValue.trim();
    router.push(`/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <div className="flex min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      {/* Left icon sidebar — desktop only (w-[68px] thin Lovable parity) */}
      <aside
        data-tour="nav"
        className="sticky top-0 hidden h-[100dvh] w-[68px] shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--sidebar)] py-4 md:flex"
      >
        <Link
          href={`/${locale}`}
          aria-label="LandMap"
          prefetch={false}
          className={`grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 ${focusRing}`}
        >
          <Image
            src="/landmap-logo-transparent.png"
            alt="LandMap"
            width={24}
            height={24}
            className="h-6 w-auto object-contain"
          />
        </Link>

        {/* Botão de Recursos Extras */}
        <button
          type="button"
          onClick={() => setExtraMenuOpen(!extraMenuOpen)}
          className={cn(
            'mt-6 grid h-11 w-11 place-items-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-white/80',
            extraMenuOpen && 'bg-white/10 text-white ring-1 ring-white/15',
            focusRing,
          )}
          title="Mais Recursos"
        >
          <Menu size={18} />
        </button>

        <nav className="mt-8 flex flex-1 flex-col items-center gap-1.5 w-full">
          {lovableNavItems.map((item) => {
            const Icon = item.Icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={`/${locale}/${item.href}`}
                data-tour={item.tour}
                className={cn(
                  'group relative grid h-11 w-11 place-items-center rounded-xl transition',
                  active
                    ? 'bg-white/10 text-white ring-1 ring-white/15'
                    : 'text-white/45 hover:bg-white/5 hover:text-white/80',
                  focusRing,
                )}
                title={item.label}
              >
                <Icon size={18} />
                <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-[var(--sidebar)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition group-hover:opacity-100">
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -left-[13px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Shield no rodapé */}
        <Link
          href={`/${locale}/admin`}
          data-tour="admin"
          className={cn(
            'grid h-11 w-11 place-items-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-white/80',
            isActive('admin') ? 'bg-white/10 text-white ring-1 ring-white/15' : '',
            focusRing,
          )}
          title="Admin"
        >
          <ShieldCheck size={18} />
        </Link>
      </aside>

      {/* Drawer Flutuante de Recursos Extras (Desktop) */}
      {extraMenuOpen && (
        <div className="fixed inset-0 z-50 hidden md:block">
          <div
            className="absolute inset-0 left-[68px] bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setExtraMenuOpen(false)}
          />
          <aside className="absolute left-[68px] top-0 flex h-full w-[320px] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] shadow-2xl backdrop-blur-xl animate-in slide-in-from-left duration-200 z-10">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
                  Mais Recursos
                </h2>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  50+ módulos & ferramentas LandMap
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar recursos"
                onClick={() => setExtraMenuOpen(false)}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                  focusRing,
                )}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 border-b border-[var(--border)]">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <input
                  type="text"
                  value={drawerFilter}
                  onChange={(e) => setDrawerFilter(e.target.value)}
                  placeholder="Filtrar recursos…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-8 pr-7 text-xs text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]/50"
                />
                {drawerFilter && (
                  <button
                    type="button"
                    onClick={() => setDrawerFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-none">
              {filteredCategories.map((cat) => (
                <div key={cat.title}>
                  <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {cat.title}
                  </h3>
                  <div className="space-y-0.5">
                    {cat.items.map((item) => {
                      const Icon = item.Icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={`/${locale}/${item.href}`}
                          onClick={() => setExtraMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                            active
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                            focusRing,
                          )}
                        >
                          <Icon size={15} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.emBreve && (
                            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header sticky h-16 */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 backdrop-blur-xl md:px-6">
          {/* Botão Funcionalidades (mobile) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((v) => !v)}
            aria-label="Funcionalidades"
            aria-expanded={mobileDrawerOpen}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] transition hover:border-[var(--primary)]/40 md:hidden ${focusRing}`}
          >
            <Menu size={18} />
          </button>

          <div className="relative flex-1 max-w-xl">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch();
              }}
              placeholder="Buscar imóveis, cidades, bairros…  (⌘K)"
              aria-label="Buscar"
              data-tour="search"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--muted)] py-2 pl-9 pr-12 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]/50"
            />
            <button
              type="button"
              onClick={submitSearch}
              aria-label="Abrir busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-1.5 text-[10px] text-[var(--muted-foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
            >
              ⌘K
            </button>
          </div>

          <Tooltip content="Notificações e alertas de oportunidade" side="bottom">
            <button
              type="button"
              aria-label="Notificações"
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] transition hover:border-[var(--primary)]/40 ${focusRing}`}
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--primary)]" />
            </button>
          </Tooltip>

          <div className="relative">
            <button
              type="button"
              aria-label="Conta"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)] ring-1 ring-[var(--border)] ${focusRing}`}
            >
              <User size={18} />
            </button>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1 pt-16 pb-[96px] md:pb-0 md:pt-0">{children}</main>
      </div>

      {/* Bottom nav mobile 5 colunas */}
      <nav
        aria-label="Navegação mobile"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--card)] backdrop-blur-xl md:hidden"
      >
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={`/${locale}/${item.href}`}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${focusRing} ${
              isActive(item.href) ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <item.Icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Drawer mobile de funcionalidades */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Funcionalidades"
        >
          <button
            type="button"
            aria-label="Fechar funcionalidades"
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
              <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
                Recursos LandMap
              </span>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setMobileDrawerOpen(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] ${focusRing}`}
              >
                <X size={18} />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 scrollbar-none"
              aria-label="Lista de funcionalidades"
            >
              <div>
                <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Principais
                </h3>
                <div className="space-y-0.5">
                  {lovableNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={`/${locale}/${item.href}`}
                      prefetch={false}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                        isActive(item.href)
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                        focusRing,
                      )}
                    >
                      <item.Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {extraCategories.map((cat) => (
                <div key={cat.title}>
                  <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {cat.title}
                  </h3>
                  <div className="space-y-0.5">
                    {cat.items.map((item) => {
                      const Icon = item.Icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={`/${locale}/${item.href}`}
                          prefetch={false}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                            active
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                            focusRing,
                          )}
                        >
                          <Icon size={16} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Comando global ⌘K / Ctrl+K */}
      <CommandPaletteHost />

      {/* Tour de boas-vindas (primeira visita, desktop) */}
      <OnboardingTour
        open={tourOpen}
        steps={TOUR_STEPS}
        storageKey="landmap:tour_done"
        onFinish={() => setTourOpen(false)}
        onSkip={() => setTourOpen(false)}
      />
    </div>
  );
}
