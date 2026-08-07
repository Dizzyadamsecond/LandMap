'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTransition, useDeferredValue, useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  LandMapWordmark,
  Search,
  X,
} from './lovable/icons';
import {
  ADMIN_NAVIGATION,
  getAllAdminNavItems,
  getCategoryByItemHref,
} from '@/lib/admin-navigation';

export function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const [collapsed, setCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['core', 'crm', 'analytics']) // Default expanded
  );
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const toggleCategory = (categoryId: string) => {
    const next = new Set(expandedCategories);
    if (next.has(categoryId)) {
      next.delete(categoryId);
    } else {
      next.add(categoryId);
    }
    setExpandedCategories(next);
  };

  // Filter items based on search
  const visibleCategories = useMemo(() => {
    if (!deferredQuery.trim()) {
      return ADMIN_NAVIGATION;
    }

    const query = deferredQuery.toLowerCase();
    return ADMIN_NAVIGATION.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [deferredQuery]);

  const handleLocaleHref = (href: string) => {
    return href.replace('^/', `/${locale}`);
  };

  // Determine which categories should show based on current route
  const currentCategory = useMemo(() => {
    const normalized = pathname.replace(`/${locale}`, '');
    return getCategoryByItemHref(normalized);
  }, [pathname, locale]);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-3 py-2">
        {!collapsed && <LandMapWordmark className="h-6" />}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="border-b border-[var(--border)] px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Buscar rotas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-8 pr-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition focus:border-[var(--ring)] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const categoryHasActiveItem = category.items.some((item) => {
            const normalized = pathname.replace(`/${locale}`, '');
            return (
              normalized === item.href ||
              (item.href.endsWith('/admin')
                ? normalized?.endsWith('/admin')
                : Boolean(normalized?.startsWith(item.href)))
            );
          });

          // Hide category in collapsed mode unless it has active items
          if (collapsed && !categoryHasActiveItem) {
            return null;
          }

          return (
            <div key={category.id}>
              {/* Category header */}
              {!collapsed && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                  aria-expanded={isExpanded}
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

              {/* Category items */}
              {isExpanded && !collapsed && (
                <div className="space-y-1 px-2 py-1">
                  {category.items.map((item) => {
                    const normalized = pathname.replace(`/${locale}`, '');
                    const active =
                      normalized === item.href ||
                      (item.href.endsWith('/admin')
                        ? normalized?.endsWith('/admin')
                        : Boolean(normalized?.startsWith(item.href)));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.id}
                        href={handleLocaleHref(item.href)}
                        className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition ${
                          active
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                        title={item.label}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="inline-flex items-center justify-center rounded-full bg-[var(--destructive)] text-[10px] font-bold text-[var(--destructive-foreground)] w-5 h-5">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Collapsed category items */}
              {collapsed && categoryHasActiveItem && (
                <div className="space-y-1 px-1 py-1">
                  {category.items.map((item) => {
                    const normalized = pathname.replace(`/${locale}`, '');
                    const active =
                      normalized === item.href ||
                      (item.href.endsWith('/admin')
                        ? normalized?.endsWith('/admin')
                        : Boolean(normalized?.startsWith(item.href)));
                    const Icon = item.icon;

                    if (!active) return null;

                    return (
                      <Link
                        key={item.id}
                        href={handleLocaleHref(item.href)}
                        className="flex items-center justify-center rounded-lg p-2 bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm transition"
                        title={item.label}
                        aria-current="page"
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {visibleCategories.length === 0 && !collapsed && (
          <div className="p-6 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">
              Nenhuma rota encontrada
            </p>
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] p-3">
          <Link
            href={`/${locale}`}
            prefetch={false}
            className="block rounded-lg px-2 py-1.5 text-[11px] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Voltar ao site
          </Link>
        </div>
      )}
    </aside>
  );
}
