import { ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BarChart,
  Bell,
  BellRing,
  BookA,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
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
  Lock,
  Map,
  MapPin,
  MapPinned,
  MessageSquare,
  PenLine,
  Plug,
  Radio,
  RefreshCw,
  Satellite,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  Wand2,
  Workflow,
} from '../lovable/icons';

export type IconComponent = ComponentType<{ size?: number; className?: string }>;

export function CameraGlyph({ size = 24, className }: { size?: number; className?: string }) {
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

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]';

export interface NavItem {
  href: string;
  label: string;
  Icon: IconComponent;
  tour?: string;
  emBreve?: boolean;
}

export interface NavCategory {
  title: string;
  items: NavItem[];
}

export const lovableNavItems: NavItem[] = [
  { href: 'dashboard', label: 'Mapa', Icon: Map, tour: 'map' },
  { href: 'dashboard', label: 'Dashboard', Icon: LayoutGrid, emBreve: true },
  { href: 'compare', label: 'Comparador', Icon: GitCompare },
  { href: 'favorites', label: 'Favoritos', Icon: Star },
  { href: 'alerts', label: 'Alertas', Icon: Bell, emBreve: true },
  { href: 'reports', label: 'Relatórios', Icon: BarChart, emBreve: true },
  { href: 'assistant', label: 'IA LandMap', Icon: Sparkles, emBreve: true },
  { href: 'settings', label: 'Configurações', Icon: Settings, emBreve: true },
];

export const extraCategories: NavCategory[] = [
  {
    title: 'Inteligência & Mercado',
    items: [
      { href: 'map', label: 'Mapa Interativo', Icon: Map },
      { href: 'regions', label: 'Regiões', Icon: MapPin },
      { href: 'insights', label: 'Insights', Icon: BellRing },
      // Páginas reais do LandMap que a trilha principal marca "em breve" por
      // paridade Lovable — ficam acessíveis aqui para não virarem órfãs.
      { href: 'alerts', label: 'Alertas', Icon: Bell },
      { href: 'heatmap', label: 'Heatmap', Icon: Flame },
      { href: 'market', label: 'Mercado', Icon: LineChart },
      { href: 'worldmonitor', label: 'WorldMonitor', Icon: Satellite },
      { href: 'history40', label: 'History40', Icon: LineChart },
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
      { href: 'assistant', label: 'Assistente IA', Icon: Sparkles },
      { href: 'calculator', label: 'Calculadora', Icon: PenLine },
      { href: 'compare/opportunities', label: 'Comparar Oportunidades', Icon: ArrowLeftRight },
      { href: 'copilot', label: 'IA Field Copilot Scanner', Icon: CameraGlyph },
      { href: 'inspect', label: 'Inspecionar', Icon: Eye },
      { href: 'kpis', label: 'KPIs', Icon: BarChart },
      { href: 'live', label: 'Ao Vivo', Icon: Radio },
      { href: 'pipeline', label: 'Pipeline', Icon: Workflow },
      { href: 'radar', label: 'Radar', Icon: Radio },
      { href: 'radar-insights', label: 'Radar Insights', Icon: BellRing },
      { href: 'rag', label: 'RAG', Icon: Sparkles },
      { href: 'recommendations', label: 'Recomendações', Icon: Sparkles },
      { href: 'reports', label: 'Relatórios', Icon: BarChart },
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
      { href: 'leiloes', label: 'Leilões', Icon: Briefcase },
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
      { href: 'brasil', label: 'APIs Brasil', Icon: Plug },
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
      { href: 'settings', label: 'Configurações', Icon: Settings },
      { href: 'onboarding', label: 'Onboarding', Icon: ArrowRight },
      { href: 'intro', label: 'Introdução', Icon: ArrowRight },
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
