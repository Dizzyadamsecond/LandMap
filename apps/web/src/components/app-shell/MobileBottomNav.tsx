'use client';

import Link from 'next/link';
import { Map, GitCompare, Star, ShieldCheck } from '../lovable/icons';
import { focusRing } from './types';
import { cn } from '@landmap/ui';

interface MobileBottomNavProps {
  locale: string;
  isActive: (href: string) => boolean;
}

const bottomItems = [
  { href: 'dashboard', label: 'Mapa', Icon: Map },
  { href: 'compare', label: 'Comparador', Icon: GitCompare },
  { href: 'favorites', label: 'Favoritos', Icon: Star },
  { href: 'admin', label: 'Admin', Icon: ShieldCheck },
];

export function MobileBottomNav({ locale, isActive }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl md:hidden"
    >
      {bottomItems.map((item) => {
        const Icon = item.Icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={`/${locale}/${item.href}`}
            prefetch={false}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              focusRing,
              active ? 'text-[var(--primary)]' : 'text-[var(--foreground)]/50'
            )}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
