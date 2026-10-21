'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Route-transition wrapper. App Router remounts `template.tsx` on every
 * navigation, so the `animate-in` utility replays — a subtle, tasteful
 * fade-and-rise that reads as "premium" without ever getting in the way.
 *
 * CRÍTICO (CSS Spec - W3C Transforms & Containing Block):
 * Qualquer elemento pai com `transform` (mesmo transitório, como `translateY`)
 * cria um novo "containing block" e quebra elementos filhos com `position: fixed`
 * (como o `SplashScreen`, cuja div é `fixed inset-0 z-50`).
 *
 * Por isso, para a rota raiz de entrada `/{locale}` e `/splash`, desabilitamos
 * o wrapper com `transform`/`animate-in`, garantindo que a tela inteira (100vw x 100vh)
 * seja ocupada pelo fundo `#0d3183` e a animação do logo seja visível.
 */
export default function LocaleTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const segs = pathname.split('/').filter(Boolean); // ['pt-BR'] ou ['pt-BR', 'splash']
  const isSplashOrRoot = segs.length <= 1 || segs[1] === 'splash';

  if (isSplashOrRoot) {
    return <>{children}</>;
  }

  return <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>;
}

