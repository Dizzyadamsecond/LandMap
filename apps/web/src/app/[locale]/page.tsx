'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SplashScreen } from '../../components/lovable/SplashScreen';

/**
 * Entrada do app em `/{locale}` — destino do redirect de `/`
 * (o middleware do next-intl usa `localePrefix: 'always'`, então a raiz 307 → `/pt-BR`).
 *
 * Renderiza o **splash extraído 1:1 da Lovable LIVE** (ver
 * `components/lovable/SplashScreen.tsx` + `.logo-mark*` em `app/globals.css`) e,
 * ao fim da animação (1900ms fade / 2300ms troca), segue o fluxo da Lovable:
 *
 *   / → /splash → /landing   (medido ao vivo: idêntico para anônimo e para
 *                             `guest_mode === '1'` — a Lovable NÃO desvia para
 *                             onboarding/dashboard a partir da raiz)
 *
 * O desvio por sessão continua existindo, mas acontece depois: `/landing` é a
 * página pública de vendas e o gate de `/dashboard` é que manda para `/auth`.
 */
export default function LocaleIndexPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  /**
   * Destino fixo (`/landing`), sem leitura de localStorage: é exatamente o que a
   * Lovable LIVE faz. Constante no primeiro render, então o HTML do SSR e o
   * primeiro render do cliente continuam idênticos — sem mismatch de hidratação
   * e com os timers do splash começando no mount, igual ao original.
   */
  const [destination] = useState(`/${locale}/landing`);

  return <SplashScreen destination={destination} />;
}
