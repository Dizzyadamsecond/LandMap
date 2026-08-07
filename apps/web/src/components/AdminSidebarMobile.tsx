'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  ChevronDown,
  X,
  Menu,
  Search,
} from './lovable/icons';
import {
  ADMIN_NAVIGATION,
  getCategoryByItemHref,
} from '@/lib/admin-navigation';

/**
 * Mobile drawer navigation for admin section
 * Displays as a hamburger menu drawer on screens < 768px
 */
export function AdminSidebarMobile() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['crm', 'analytics'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryId: string) => {
    const next = new Set(expandedCategories);
    if (next.has(categoryId)) {
      next.delete(categoryId);
    } else {
      next.add(categoryId);
    }
    setExpandedCategories(next);
  };

  // Filter categories based on search
  const visibleCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return ADMIN_NAVIGATION;
    }

    const query = searchQuery.toLowerCase();
    return ADMIN_NAVIGATION.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const handleLocaleHref = (href: string) => {
    return href.replace('^/', `/${locale}`);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs overflow-y-auto bg-[var(--background)] shadow-lg transition-transform md:hidden">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
              <h2 className="text-sm font-semibold">Admin</h2>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-[var(--border)] p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Buscar rotas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-8 pr-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition focus:border-[var(--ring)] focus:outline-none"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="py-2">
              {visibleCategories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                      aria-expanded={isExpanded}
                    >
                      <span>{category.label}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Category items */}
                    {isExpanded && (
                      <div className="space-y-1 border-l border-[var(--border)] px-2 py-1 ml-3">
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
                              onClick={closeDrawer}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                                active
                                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                              }`}
                              aria-current={active ? 'page' : undefined}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1">{item.label}</span>
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
                  </div>
                );
              })}

              {/* Empty state */}
              {visibleCategories.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Nenhuma rota encontrada
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-[var(--border)] p-3 mt-4">
                <Link
                  href={`/${locale}`}
                  onClick={closeDrawer}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  ← Voltar ao site
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
