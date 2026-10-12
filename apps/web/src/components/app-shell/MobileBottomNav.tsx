'use client';

import Link from 'next/link';
import { BarChart, Map, Star, User } from '../lovable/icons';
import { focusRing } from './types';
import { cn } from '@landmap/ui';

interface MobileBottomNavProps {
  locale: string;
  isActive: (href: string) => boolean;
}

/**
 * Nav inferior mobile = MESMA trilha da sidebar e da Lovable LIVE (array `Q`):
 * Radar(/insights) → Mapa(/dashboard) → Favoritos(/favorites) → Perfil(/profile).
 * O resto das páginas do produto fica no drawer "Recursos LandMap" (menu do topo).
 */
const bottomItems = [
  { href: 'insights', label: 'Radar', Icon: BarChart },
  { href: 'dashboard', label: 'Mapa', Icon: Map },
  { href: 'favorites', label: 'Favoritos', Icon: Star },
  { href: 'profile', label: 'Perfil', Icon: User },
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
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
              focusRing,
              active ? 'text-[var(--primary)]' : 'text-[var(--foreground)]/45'
            )}
          >
            {active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--primary)]" />
            )}
            <Icon size={20} className={active ? 'stroke-2' : 'stroke-[1.75]'} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
