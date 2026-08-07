/**
 * Admin Navigation Manifest
 *
 * Centralized configuration for all 47+ admin routes, organized by category.
 * Used by AdminSidebar, breadcrumbs, mobile drawer, and search.
 *
 * Last updated: 2026-08-07
 */

import {
  LineChart,
  Building2,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  BellRing,
  ShieldCheck,
  Activity,
  Zap,
  Users,
  AlertTriangle,
  TrendingUp,
  FileText,
  Workflow,
  MessageSquare,
  Settings,
  BarChart,
  CalendarClock,
  Gem,
  BookOpen,
  Code2,
  Send,
  Search,
} from '@/components/lovable/icons';

export type IconType = React.ComponentType<{ className?: string }>;

export interface AdminNavItem {
  id: string;
  href: string;
  label: string;
  description?: string;
  icon: IconType;
  badge?: string; // e.g., "5" for pending items
}

export interface AdminNavCategory {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  items: AdminNavItem[];
}

/**
 * Admin navigation categories
 * Organized by feature domains: CRM, Analytics, Operations, Config
 */
export const ADMIN_NAVIGATION: AdminNavCategory[] = [
  {
    id: 'core',
    label: 'Core',
    description: 'Dashboard e navegação principal',
    icon: LineChart,
    items: [
      {
        id: 'dashboard',
        href: '/admin',
        label: 'Dashboard',
        description: 'Visão geral do sistema',
        icon: LineChart,
      },
    ],
  },

  {
    id: 'crm',
    label: 'CRM & Vendas',
    description: 'Leads, propostas, follow-ups e agentes',
    icon: Gem,
    items: [
      {
        id: 'leads',
        href: '/admin/leads',
        label: 'Leads',
        description: 'Gerenciar leads e oportunidades',
        icon: Star,
      },
      {
        id: 'properties',
        href: '/admin/properties',
        label: 'Terrenos',
        description: 'Gerenciar propriedades e imóveis',
        icon: Building2,
      },
      {
        id: 'visits',
        href: '/admin/visits',
        label: 'Visitas',
        description: 'Agendamentos e acompanhamento de visitas',
        icon: CalendarClock,
      },
      {
        id: 'proposals',
        href: '/admin/proposals',
        label: 'Propostas',
        description: 'Criar e gerenciar propostas',
        icon: FileText,
      },
      {
        id: 'followups',
        href: '/admin/followups',
        label: 'Follow-ups',
        description: 'Acompanhamento de oportunidades',
        icon: Activity,
      },
      {
        id: 'kanban',
        href: '/admin/kanban',
        label: 'Kanban',
        description: 'Visualização de pipeline em Kanban',
        icon: SlidersHorizontal,
      },
      {
        id: 'agents',
        href: '/admin/agents',
        label: 'Agentes',
        description: 'Vendedores e equipes de vendas',
        icon: Users,
      },
      {
        id: 'cockpit',
        href: '/admin/cockpit',
        label: 'Cockpit de Vendas',
        description: 'Painel de controle de vendas',
        icon: SlidersHorizontal,
      },
      {
        id: 'subscriptions',
        href: '/admin/subscriptions',
        label: 'Subscriptions',
        description: 'Gerenciar subscrições de clientes',
        icon: BookOpen,
      },
    ],
  },

  {
    id: 'analytics',
    label: 'Analytics & Insights',
    description: 'Dados, métricas e relatórios',
    icon: BarChart,
    items: [
      {
        id: 'analytics',
        href: '/admin/analytics',
        label: 'Analytics',
        description: 'Métricas e KPIs gerais',
        icon: BarChart,
      },
      {
        id: 'growth',
        href: '/admin/growth',
        label: 'Growth',
        description: 'Análise de crescimento',
        icon: TrendingUp,
      },
      {
        id: 'engagement',
        href: '/admin/engagement',
        label: 'Engajamento',
        description: 'Métricas de engajamento de usuários',
        icon: Activity,
      },
      {
        id: 'retention',
        href: '/admin/retention',
        label: 'Retenção',
        description: 'Análise de retenção de clientes',
        icon: Users,
      },
      {
        id: 'churnrisk',
        href: '/admin/retention/churn-risk',
        label: 'Risco de Churn',
        description: 'Clientes com risco de cancelamento',
        icon: AlertTriangle,
      },
      {
        id: 'cta',
        href: '/admin/cta',
        label: 'CTAs',
        description: 'Análise de chamadas para ação',
        icon: Gem,
      },
      {
        id: 'experiments',
        href: '/admin/experiments',
        label: 'Experimentos',
        description: 'A/B testes e experimentos',
        icon: Zap,
      },
    ],
  },

  {
    id: 'operations',
    label: 'Operações',
    description: 'Webhooks, notificações, automações',
    icon: Workflow,
    items: [
      {
        id: 'webhooks',
        href: '/admin/webhooks',
        label: 'Webhooks',
        description: 'Gerenciar integrações via webhooks',
        icon: Layers,
      },
      {
        id: 'notifications',
        href: '/admin/notifications',
        label: 'Notificações',
        description: 'Gerenciar notificações do sistema',
        icon: BellRing,
      },
      {
        id: 'workflows',
        href: '/admin/workflows',
        label: 'Workflows',
        description: 'Automações e workflows',
        icon: Workflow,
      },
      {
        id: 'integrations',
        href: '/admin/integrations',
        label: 'Integrações',
        description: 'APIs e integrações externas',
        icon: Layers,
      },
      {
        id: 'openwa',
        href: '/admin/openwa',
        label: 'OpenWA',
        description: 'Integração WhatsApp',
        icon: Send,
      },
      {
        id: 'scout',
        href: '/admin/scout',
        label: 'Scout',
        description: 'Monitoramento de dados',
        icon: Search,
      },
      {
        id: 'costs',
        href: '/admin/costs',
        label: 'Custos',
        description: 'Análise de custos operacionais',
        icon: SlidersHorizontal,
      },
    ],
  },

  {
    id: 'config',
    label: 'Configuração & Segurança',
    description: 'Flags, alertas, auditoria, permissões',
    icon: Settings,
    items: [
      {
        id: 'settings',
        href: '/admin/settings',
        label: 'Configurações',
        description: 'Configurações gerais do sistema',
        icon: Settings,
      },
      {
        id: 'featureflags',
        href: '/admin/feature-flags',
        label: 'Feature Flags',
        description: 'Ativar/desativar recursos',
        icon: Zap,
      },
      {
        id: 'alertrules',
        href: '/admin/alert-rules',
        label: 'Alertas',
        description: 'Regras de alerta do sistema',
        icon: AlertTriangle,
      },
      {
        id: 'audit',
        href: '/admin/audit',
        label: 'Auditoria',
        description: 'Log de ações e auditoria',
        icon: ShieldCheck,
      },
      {
        id: 'accounts',
        href: '/admin/accounts',
        label: 'Contas',
        description: 'Gerenciar contas de usuários',
        icon: Users,
      },
      {
        id: 'team',
        href: '/admin/team',
        label: 'Time',
        description: 'Equipe e permissões',
        icon: Users,
      },
      {
        id: 'onboarding',
        href: '/admin/onboarding',
        label: 'Onboarding',
        description: 'Configuração de onboarding',
        icon: Activity,
      },
    ],
  },

  {
    id: 'tools',
    label: 'Ferramentas & Dados',
    description: 'Desenvolvedor, export, CRM',
    icon: Code2,
    items: [
      {
        id: 'developers',
        href: '/admin/developers',
        label: 'Desenvolvedores',
        description: 'API keys e documentação para devs',
        icon: Code2,
      },
      {
        id: 'exports',
        href: '/admin/exports',
        label: 'Exportações',
        description: 'Exportar dados do sistema',
        icon: ArrowUpDown,
      },
      {
        id: 'crm',
        href: '/admin/crm-telemetry',
        label: 'CRM Telemetria',
        description: 'Dados de integração CRM',
        icon: BookOpen,
      },
      {
        id: 'watchlist',
        href: '/admin/watchlist',
        label: 'Watchlist',
        description: 'Monitorar imóveis importantes',
        icon: Star,
      },
      {
        id: 'writer',
        href: '/admin/writer',
        label: 'AI Writer',
        description: 'Gerar descrições com IA',
        icon: MessageSquare,
      },
      {
        id: 'warroom',
        href: '/admin/warroom',
        label: 'War Room',
        description: 'Central de crise e resgate',
        icon: MessageSquare,
      },
      {
        id: 'activity',
        href: '/admin/activity',
        label: 'Atividade',
        description: 'Log de atividades do sistema',
        icon: Activity,
      },
    ],
  },

  {
    id: 'special',
    label: 'Especial',
    description: 'Consórcio, leilão, mercado',
    icon: Building2,
    items: [
      {
        id: 'consorcio',
        href: '/admin/consorcio',
        label: 'Consórcio',
        description: 'Gerenciar imóveis em consórcio',
        icon: Building2,
      },
      {
        id: 'leilao',
        href: '/admin/leilao',
        label: 'Leilão',
        description: 'Imóveis em leilão',
        icon: TrendingUp,
      },
    ],
  },
];

/**
 * Flatten categories into single list for search/filter
 */
export function getAllAdminNavItems(): AdminNavItem[] {
  return ADMIN_NAVIGATION.flatMap((category) => category.items);
}

/**
 * Find a nav item by href
 */
export function getAdminNavItemByHref(href: string): AdminNavItem | undefined {
  return getAllAdminNavItems().find((item) => item.href === href);
}

/**
 * Find a category by id
 */
export function getAdminCategoryById(id: string): AdminNavCategory | undefined {
  return ADMIN_NAVIGATION.find((cat) => cat.id === id);
}

/**
 * Find category that contains a given href
 */
export function getCategoryByItemHref(href: string): AdminNavCategory | undefined {
  return ADMIN_NAVIGATION.find((cat) =>
    cat.items.some((item) => item.href === href)
  );
}

/**
 * Build breadcrumb path from href
 * e.g., "/admin/cta/123" => [Dashboard, CTAs, CTA #123]
 */
export function buildBreadcrumb(pathname: string): Array<{ label: string; href?: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumb: Array<{ label: string; href?: string }> = [];

  // Root
  breadcrumb.push({ label: 'Admin', href: '/admin' });

  if (segments.length > 1) {
    // Find the main section
    const section = segments[1];
    const navItem = getAdminNavItemByHref(`/admin/${section}`);

    if (navItem) {
      breadcrumb.push({ label: navItem.label, href: navItem.href });
    } else {
      breadcrumb.push({ label: section.charAt(0).toUpperCase() + section.slice(1) });
    }

    // Add detail segment if present
    if (segments.length > 2) {
      const detailSegment = segments[2];
      breadcrumb.push({
        label: `#${detailSegment}`,
      });
    }
  }

  return breadcrumb;
}
