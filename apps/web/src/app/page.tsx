'use client';

import { useState } from 'react';
import { SplashScreen } from '@/components/lovable/SplashScreen';

/**
 * Raiz `/` — mesma entrada do splash extraído 1:1 da Lovable LIVE.
 *
 * Observação: com `localePrefix: 'always'` o middleware do next-intl responde
 * `/` com um 307 para `/{locale}` (em produção, `/pt-BR`). Este arquivo existe
 * como fallback determinístico caso o prefixo de locale mude de estratégia —
 * por isso ele replica exatamente o mesmo comportamento da entrada localizada:
 * splash → `/landing` (idêntico à Lovable live, para anônimo e para visitante).
 */
export default function RootRedirect() {
  const [destination] = useState('/pt-BR/landing');

  return <SplashScreen destination={destination} />;
}
