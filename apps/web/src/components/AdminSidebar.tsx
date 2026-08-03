'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';
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
  ChevronRight,
  ChevronDown,
  LandMapWordmark,
  Filter,
  GitCompare,
  CalendarClock,
  FileText,
  TrendingUp,
} from './lovable/icons';

const ICONS = {
  dashboard: LineChart,
  properties: Building2,
  leads: Star,
  visits: CalendarClock,
  proposals: FileText,
  followups: Activity,
  kanban: GitCompare,
  agents: Activity,
  analytics: SlidersHorizontal,
  exports: ArrowUpDown,
  openwa: BellRing,
  webhooks: Layers,
  settings: BellRing,
  audit: ShieldCheck,
  consorcio: Star,
  leilao: TrendingUp,
} as const;

type IconKey = keyof typeof ICONS;

export function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [collapsed, setCollapsed] = useState(false);

  const links: { href: string; icon: IconKey; label: string }[] = [
    { href: `/${locale}/admin`, icon: 'dashboard', label: 'Dashboard' },
    { href: `/${locale}/admin/properties`, icon: 'properties', label: 'Terrenos' },
    { href: `/${locale}/admin/leads`, icon: 'leads', label: 'Leads' },
    { href: `/${locale}/admin/visits`, icon: 'visits', label: 'Visitas' },
    { href: `/${locale}/admin/proposals`, icon: 'proposals', label: 'Propostas' },
    { href: `/${locale}/admin/followups`, icon: 'followups', label: 'Follow-ups' },
    { href: `/${locale}/admin/kanban`, icon: 'kanban', label: 'Kanban' },
    { href: `/${locale}/admin/agents`, icon: 'agents', label: 'Agentes' },
    { href: `/${locale}/admin/analytics`, icon: 'analytics', label: 'Analytics' },
    { href: `/${locale}/admin/exports`, icon: 'exports', label: 'Exportações' },
    { href: `/${locale}/admin/openwa`, icon: 'openwa', label: 'OpenWA' },
    { href: `/${locale}/admin/webhooks`, icon: 'webhooks', label: 'Webhooks' },
    { href: `/${locale}/admin/settings`, icon: 'settings', label: 'Configurações' },
    { href: `/${locale}/admin/audit`, icon: 'audit', label: 'Auditoria' },
    { href: `/${locale}/admin/consorcio`, icon: 'consorcio', label: 'Consórcio' },
    { href: `/${locale}/admin/leilao`, icon: 'leilao', label: 'Leilão' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Toggle */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        {!collapsed && <LandMapWordmark />}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href.endsWith('/admin')
              ? pathname?.endsWith('/admin')
              : Boolean(pathname?.startsWith(link.href)));
          const Icon = ICONS[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                active
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              title={link.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] p-3">
          <Link
            href={`/${locale}`}
            prefetch={false}
            className="block rounded-2xl px-3 py-2 text-[11px] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Voltar ao site
          </Link>
        </div>
      )}
    </aside>
  );
}
