'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X } from '../lovable/icons';
import { extraCategories, focusRing } from './types';
import { cn } from '@landmap/ui';

interface ResourceDrawerProps {
  locale: string;
  isActive: (href: string) => boolean;
  extraMenuOpen: boolean;
  setExtraMenuOpen: (open: boolean) => void;
}

export function ResourceDrawer({
  locale,
  isActive,
  extraMenuOpen,
  setExtraMenuOpen,
}: ResourceDrawerProps) {
  const [filterQuery, setFilterQuery] = useState('');

  // Close extra resource drawer on backdrop click / Escape key
  useEffect(() => {
    if (!extraMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExtraMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [extraMenuOpen, setExtraMenuOpen]);

  // Filter categories by query
  const filteredCategories = useMemo(() => {
    if (!filterQuery) return extraCategories;
    const lowerQuery = filterQuery.toLowerCase();

    return extraCategories
      .map((cat) => {
        const matchingItems = cat.items.filter((item) =>
          item.label.toLowerCase().includes(lowerQuery)
        );
        return { ...cat, items: matchingItems };
      })
      .filter((cat) => cat.items.length > 0);
  }, [filterQuery]);

  if (!extraMenuOpen) return null;

  return (
    <div className="fixed inset-y-0 left-[68px] z-50 flex h-[100dvh] w-[320px] flex-col border-r border-[var(--border)] bg-[var(--sidebar)]/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-left duration-300">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
        <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
          Recursos Adicionais
        </span>
        <button
          type="button"
          onClick={() => setExtraMenuOpen(false)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            focusRing
          )}
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="search"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar ferramentas..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 py-1.5 pl-8 pr-3 text-xs text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]/50"
          />
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-none"
        aria-label="Recursos adicionais do LandMap"
      >
        {filteredCategories.map((cat) => (
          <div key={cat.title} className="mb-6">
            <h4 className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {cat.title}
            </h4>
            <div className="flex flex-col gap-0.5">
              {cat.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}/${item.href}`}
                    prefetch={false}
                    onClick={() => setExtraMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs transition",
                      focusRing,
                      active
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <item.Icon size={14} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
