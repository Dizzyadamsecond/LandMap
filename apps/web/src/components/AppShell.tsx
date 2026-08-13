'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
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
import { Tooltip, OnboardingTour, type TourStep } from '@landmap/ui';
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

// Ordem 1:1 com a Lovable (NAV literal do reference-lovable/src/routes/_authenticated/route.tsx):
// Mapa → Dashboard → Comparador → Favoritos → Alertas → Relatórios → IA LandMap → Configurações.
// No Lovable o "Mapa" é o /dashboard (o mapa vive no dashboard; map.tsx redireciona).
// Aqui /map é página própria (paridade do mapa) e /dashboard é a home autenticada —
// a ORDEM é literal; os destinos usam nossas rotas reais (todas existem).
const navItems: { href: string; label: string; Icon: IconComponent; emBreve?: boolean; tour?: string }[] =
  [
    // ─── Telas compartilhadas (ordem literal Lovable) ───
    { href: 'map', label: 'Mapa', Icon: Map, tour: 'map' },
    { href: 'dashboard', label: 'Dashboard', Icon: LayoutGrid },
    { href: 'compare', label: 'Comparador', Icon: GitCompare },
    { href: 'favorites', label: 'Favoritos', Icon: Star },
    { href: 'alerts', label: 'Alertas', Icon: Bell },
    { href: 'reports', label: 'Relatórios', Icon: BarChart },
    { href: 'assistant', label: 'IA LandMap', Icon: Sparkles },
    { href: 'settings', label: 'Configurações', Icon: Settings },
    // ─── Complementares LandMap (após a ordem Lovable, sem reordenar o produto) ───
    { href: 'regions', label: 'Regiões', Icon: MapPin },
    { href: 'insights', label: 'Insights', Icon: BellRing },
    { href: 'profile', label: 'Perfil', Icon: User },
    { href: 'onboarding', label: 'Onboarding', Icon: ArrowRight },
    { href: 'plans', label: 'Planos', Icon: Briefcase },
    { href: 'sobre', label: 'Sobre', Icon: FileText },
    { href: 'metodologia', label: 'Metodologia', Icon: Layers },
    { href: 'search', label: 'Buscar', Icon: Search },
    // ─── Legal (ordem Lovable: Aviso legal → Privacidade → Termos → Cookies) ───
    { href: 'aviso-legal', label: 'Aviso Legal', Icon: ShieldCheck },
    { href: 'privacy', label: 'Privacidade', Icon: Lock },
    { href: 'terms', label: 'Termos', Icon: FileText },
    { href: 'cookies', label: 'Cookies', Icon: ShieldCheck },
    // ─── Diferenciais LandMap (produto) ───
    { href: 'activity', label: 'Atividade', Icon: RefreshCw },
    { href: 'agents', label: 'Agentes', Icon: Bot },
    { href: 'alerts', label: 'Alertas', Icon: Bell },
    { href: 'api-keys', label: 'API Keys', Icon: Lock },
    { href: 'assistant', label: 'Assistente', Icon: Bot },
    { href: 'automations', label: 'Automações', Icon: Workflow },
    { href: 'calculator', label: 'Calculadora', Icon: PenLine },
    { href: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: 'checkout', label: 'Checkout', Icon: CreditCard },
    { href: 'cities', label: 'Cidades', Icon: Building2 },
    { href: 'cobertura', label: 'Cobertura', Icon: Satellite },
    { href: 'cockpit', label: 'Cockpit', Icon: Radio },
    { href: 'compare/opportunities', label: 'Comparar Oportunidades', Icon: ArrowLeftRight },
    { href: 'consorcio', label: 'Consórcio', Icon: Briefcase },
    { href: 'copilot', label: 'IA Field Copilot Scanner', Icon: CameraGlyph },
    { href: 'developers', label: 'Developers', Icon: Code2 },
    { href: 'developers/api-reference', label: 'API Reference', Icon: Code2 },
    { href: 'docs', label: 'Documentação', Icon: BookOpen },
    { href: 'docs/embedding', label: 'Embeddings', Icon: BookA },
    { href: 'fontes', label: 'Fontes', Icon: Link2 },
    { href: 'glossary', label: 'Glossário', Icon: BookOpen },
    { href: 'heatmap', label: 'Heatmap', Icon: Flame },
    { href: 'inspect', label: 'Inspecionar', Icon: Eye },
    { href: 'integrations', label: 'Integrações', Icon: Plug },
    { href: 'investment-memo', label: 'Investment Memo', Icon: FileText },
    { href: 'investor', label: 'Investidor', Icon: Briefcase },
    { href: 'knowledge', label: 'Knowledge Base', Icon: BookOpen },
    { href: 'kpis', label: 'KPIs', Icon: BarChart },
    { href: 'launch', label: 'Lançamento', Icon: Sparkles },
    { href: 'leads', label: 'Leads', Icon: Users },
    { href: 'live', label: 'Ao Vivo', Icon: Radio },
    { href: 'market', label: 'Mercado', Icon: LineChart },
    { href: 'market-index', label: 'Índice Regional', Icon: TrendingUp },
    { href: 'neighborhoods', label: 'Bairros', Icon: MapPin },
    { href: 'notifications', label: 'Notificações', Icon: Bell },
    { href: 'pipeline', label: 'Pipeline', Icon: Workflow },
    { href: 'plans/manage', label: 'Gestão de Planos', Icon: CreditCard },
    { href: 'portfolio', label: 'Portfólio', Icon: Briefcase },
    { href: 'pricing', label: 'Preços', Icon: CreditCard },
    { href: 'radar', label: 'Radar', Icon: Radio },
    { href: 'rag', label: 'RAG', Icon: Sparkles },
    { href: 'recommendations', label: 'Recomendações', Icon: Sparkles },
    { href: 'reports', label: 'Relatórios', Icon: FileText },
    { href: 'resources', label: 'Recursos', Icon: BookOpen },
    { href: 'risk-radar', label: 'Radar de Risco', Icon: AlertTriangle },
    { href: 'sales', label: 'Vendas', Icon: TrendingUp },
    { href: 'settings', label: 'Configurações', Icon: Settings },
    { href: 'status', label: 'Status', Icon: Activity },
    { href: 'studio', label: 'Studio', Icon: Wand2 },
    { href: 'syndicate', label: 'Sindicatos LPs', Icon: Briefcase },
    { href: 'team', label: 'Time', Icon: Users },
    { href: 'terrenos', label: 'Terrenos', Icon: MapPinned },
    { href: 'underwriting', label: 'Underwriting & Estresse', Icon: Activity },
    { href: 'v2', label: 'v2 (Preview)', Icon: Sparkles },
    { href: 'valorization', label: 'Valorização', Icon: TrendingUp },
    { href: 'viabilidade', label: 'Viabilidade Construtiva', Icon: Activity },
    { href: 'warroom', label: 'War Room', Icon: AlertTriangle },
    { href: 'watchlist', label: 'Watchlist', Icon: Star },
    { href: 'workflows', label: 'Workflows', Icon: Workflow },
    { href: 'world', label: 'Mundo 3D', Icon: MapPinned },
    { href: 'world-3d', label: 'Mundo 3D (Beta)', Icon: MapPinned },
    { href: 'writer', label: 'Redator', Icon: PenLine },
    { href: 'zoning', label: 'Zoneamento', Icon: Layers },
    // ─── Admin & operação (isolado: o usuário só vê a entrada; o resto fica no /admin) ───
    { href: 'admin', label: 'Painel Admin', Icon: Settings, tour: 'admin' },
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
      'Todas as 18 áreas do produto ficam aqui: comparar, viabilidade, radar de risco, zoneamento e mais. Passe o mouse para ver o nome.',
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
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [tourOpen, setTourOpen] = useState(false);

  const isActive = (href: string) => {
    const full = `/${locale}/${href}`;
    return pathname === full || pathname.startsWith(full + '/');
  };

  const bottomItems = navItems.filter((item) =>
    ['search', 'map', 'copilot', 'compare', 'chat'].includes(item.href),
  );

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

  // Fecha o drawer mobile com Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
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
      {/* Sidebar desktop — lista de funcionalidades com NOME à esquerda (paridade Lovable) */}
      <aside
        data-tour="nav"
        className="sticky top-0 hidden h-[100dvh] w-[244px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] backdrop-blur-xl md:flex"
      >
        <Link
          href={`/${locale}`}
          aria-label="LandMap"
          prefetch={false}
          className={`flex items-center gap-2 px-4 py-4 ${focusRing}`}
        >
          <Image
            src="/landmap-logo-transparent.png"
            alt="LandMap"
            width={28}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            LandMap
          </span>
        </Link>
        <p className="px-4 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Funcionalidades
        </p>
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto w-full px-2 pb-6 scrollbar-none"
          aria-label="Navegação do app"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              prefetch={false}
              aria-current={isActive(item.href) ? 'page' : undefined}
              data-tour={item.tour}
              title={item.label}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${focusRing} ${
                isActive(item.href)
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {isActive(item.href) && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-[var(--primary)]" />
              )}
              <item.Icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.emBreve && (
                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header sticky h-16 */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 backdrop-blur-xl md:px-6">
          {/* Botão Funcionalidades (mobile) — abre drawer esquerdo com a lista completa + nomes */}
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
              className="absolute right-2 top-1/2 inline-flex h-7 items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-1.5 text-[10px] text-[var(--muted-foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
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

        {/* Conteúdo — pb mobile para bottom nav (antes estava no layout global e vazava no funil) */}
        <main className="min-w-0 flex-1 pt-16 pb-[96px] md:pb-0 md:pt-0">{children}</main>
      </div>

      {/* Bottom nav mobile 4 colunas */}
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

      {/* Drawer mobile de funcionalidades — lista completa à esquerda com NOME (revela ao tocar; fecha ao navegar) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Funcionalidades">
          <button
            type="button"
            aria-label="Fechar funcionalidades"
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
          />
          <aside
            data-tour="nav"
            className="absolute left-0 top-0 flex h-full w-[260px] max-w-[82vw] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] shadow-2xl animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Funcionalidades</span>
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
              className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-6 scrollbar-none"
              aria-label="Lista de funcionalidades"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}/${item.href}`}
                  prefetch={false}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${focusRing} ${
                    isActive(item.href)
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {isActive(item.href) && (
                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-[var(--primary)]" />
                  )}
                  <item.Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.emBreve && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                  )}
                </Link>
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
