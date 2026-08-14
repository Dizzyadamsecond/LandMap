'use client';

import React, { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, Search, User, X } from './lovable/icons';
import { Tooltip, OnboardingTour, cn } from '@landmap/ui';
import { CommandPaletteHost } from './CommandPaletteHost';
import { DesktopSidebar } from './app-shell/DesktopSidebar';
import { ResourceDrawer } from './app-shell/ResourceDrawer';
import { MobileBottomNav } from './app-shell/MobileBottomNav';
import Link from 'next/link';
import {
  lovableNavItems,
  extraCategories,
  focusRing,
  NavItem,
} from './app-shell/types';

const TOUR_STEPS = [
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
] as any;

export function AppShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params.locale as string) || 'pt-BR';
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [tourOpen, setTourOpen] = useState(false);

  const isActive = (href: string) => {
    const full = `/${locale}/${href}`;
    return pathname === full || pathname.startsWith(full + '/');
  };

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

  const submitSearch = () => {
    const q = searchValue.trim();
    router.push(`/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <div className="flex min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      {/* Barra lateral desktop modular (68px thin Lovable parity) */}
      <DesktopSidebar
        locale={locale}
        isActive={isActive}
        extraMenuOpen={extraMenuOpen}
        setExtraMenuOpen={setExtraMenuOpen}
      />

      {/* Gaveta flutuante modular de recursos extras (Desktop) */}
      <ResourceDrawer
        locale={locale}
        isActive={isActive}
        extraMenuOpen={extraMenuOpen}
        setExtraMenuOpen={setExtraMenuOpen}
      />

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

      {/* Bottom Nav Mobile Modular (5 colunas) */}
      <MobileBottomNav locale={locale} isActive={isActive} />

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
