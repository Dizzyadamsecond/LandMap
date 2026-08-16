'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShieldCheck } from '../lovable/icons';
import { lovableNavItems, focusRing } from './types';
import { cn } from '@landmap/ui';

interface DesktopSidebarProps {
  locale: string;
  isActive: (href: string) => boolean;
  extraMenuOpen: boolean;
  setExtraMenuOpen: (open: boolean) => void;
}

export function DesktopSidebar({
  locale,
  isActive,
  extraMenuOpen,
  setExtraMenuOpen,
}: DesktopSidebarProps) {
  return (
    <aside
      data-tour="nav"
      className="sticky top-0 hidden h-[100dvh] w-[68px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] py-4 items-center md:flex"
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
          "mt-6 grid h-11 w-11 place-items-center rounded-xl transition",
          extraMenuOpen
            ? "bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]/20"
            : "text-white/45 hover:bg-white/5 hover:text-white/80"
        )}
        title="Mais Recursos"
      >
        <Menu size={18} />
      </button>

      <nav className="mt-8 flex flex-1 flex-col items-center gap-1.5 w-full">
        {lovableNavItems.map((item) => {
          const Icon = item.Icon;
          const active = !item.emBreve && isActive(item.href);

          const itemContent = (
            <span
              className={cn(
                "group relative grid h-11 w-11 place-items-center rounded-xl transition",
                active
                  ? "bg-white/10 text-white ring-1 ring-white/15"
                  : "text-white/45 hover:bg-white/5 hover:text-white/80",
                item.emBreve && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-white/45"
              )}
              aria-label={item.label}
            >
              <Icon size={18} />
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-[var(--sidebar)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition group-hover:opacity-100 z-50">
                {item.label}
                {item.emBreve && <span className="ml-1.5 text-white/40 font-normal">em breve</span>}
              </span>
              {active && (
                <span className="absolute -left-[13px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--primary)]" />
              )}
            </span>
          );

          if (item.emBreve) {
            return (
              <div key={`${item.label}-${item.href}`} className="select-none">
                {itemContent}
              </div>
            );
          }

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={`/${locale}/${item.href}`}
              prefetch={false}
            >
              {itemContent}
            </Link>
          );
        })}
      </nav>

      {/* Admin Shield no rodapé */}
      <Link
        href={`/${locale}/admin`}
        prefetch={false}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-xl transition",
          isActive('admin')
            ? "bg-white/10 text-white ring-1 ring-white/15"
            : "text-white/45 hover:bg-white/5 hover:text-white/80"
        )}
        title="Admin"
      >
        <ShieldCheck size={18} />
      </Link>
    </aside>
  );
}
