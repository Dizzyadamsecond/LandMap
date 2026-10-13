'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { AppShell } from './AppShell';

// Rotas "bare" (sem AppShell) — espelha o Lovable: funil público + mapa full-page.
// O resto usa o AppShell autenticado (sidebar 68px + header).
//
// `splash` e `landing` PRECISAM estar aqui: são as duas primeiras telas do
// funil da Lovable (`/` → `/splash` → `/landing`) e são públicas. Sem isso elas
// caíam no AppShell, que redireciona visitante anônimo para `/auth` — ou seja,
// a animação de entrada nunca rodava para quem chega sem sessão.
const PUBLIC_SEGMENTS = ['auth', 'plans', 'pricing', 'onboarding', 'splash', 'landing'];

export function ShellSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const seg = pathname.split('/').filter(Boolean); // ['pt-BR','dashboard']
  const usePublic = !seg[1] || PUBLIC_SEGMENTS.includes(seg[1]);

  if (usePublic) {
    return (
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
