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
import { readMockUser, signOutMock } from '../lib/mockAuth';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof readMockUser>>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const isGuest =
      typeof window !== 'undefined' &&
      (window.localStorage.getItem('guest_mode') === '1' ||
        window.localStorage.getItem('landmap:guest_mode') === '1');
    const user = readMockUser();
    setCurrentUser(user);
    const isAuthed = (user && user.provider !== 'guest') || isGuest;

    if (!isAuthed) {
      router.replace(`/${locale}/auth`);
    } else {
      setAuthorized(true);
    }
  }, [pathname, router, locale]);

  const handleSignOut = () => {
    signOutMock();
    router.replace(`/${locale}/auth`);
    router.refresh();
  };

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
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Perfil"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-[var(--muted)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] text-[13px] font-semibold text-white">
                {(currentUser?.email?.[0] ?? 'L').toUpperCase()}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-[11px] leading-tight text-[var(--muted-foreground)]">
                  Conta
                </span>
                <span className="block max-w-[140px] truncate text-xs font-semibold leading-tight text-[var(--foreground)]">
                  {currentUser?.email ?? 'Visitante'}
                </span>
              </span>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)] truncate">
                  {currentUser?.email ?? 'Modo visitante'}
                </div>
                <Link
                  href={`/${locale}/plans`}
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                >
                  <User size={14} /> Alterar plano
                </Link>
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                >
                  Admin
                </Link>
                <div className="my-1 h-px bg-[var(--border)]" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--destructive)] transition hover:bg-[var(--muted)]"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">{authorized === false ? null : children}</main>
      </div>

      {/* Bottom Nav Mobile Modular (4 colunas — Lovable usa 3 + 1 vazia; aqui o 4º slot é o Admin) */}
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
                  {/* Chave = label+href: "Mapa" e "Dashboard" apontam para o mesmo
                      href no Lovable, e uma key duplicada faz o React descartar/
                      reordenar itens da lista. */}
                  {lovableNavItems.map((item) => {
                    const Icon = item.Icon;
                    const active = !item.emBreve && isActive(item.href);

                    if (item.emBreve) {
                      return (
                        <div
                          key={`${item.label}-${item.href}`}
                          aria-disabled
                          title="Em breve"
                          className="flex cursor-not-allowed select-none items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] opacity-40"
                        >
                          <Icon size={18} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                          <span className="ml-auto shrink-0 text-[10px] font-normal">em breve</span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`${item.label}-${item.href}`}
                        href={`/${locale}/${item.href}`}
                        prefetch={false}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                          active
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                            : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                          focusRing,
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
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
