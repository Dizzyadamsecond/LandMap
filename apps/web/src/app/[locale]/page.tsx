'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { readMockUser } from '../../lib/mockAuth';

/**
 * Root locale page (/{locale}) — segue o fluxo exato 1:1 do Lovable (src/routes/index.tsx):
 * - Se autenticado ou modo visitante (guest_mode="1"): redireciona para /{locale}/dashboard (Mapa)
 * - Se não autenticado: redireciona para /{locale}/onboarding (Tutorial/Slides)
 */
export default function LocaleIndexPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  useEffect(() => {
    const isGuest =
      typeof window !== 'undefined' &&
      (window.localStorage.getItem('guest_mode') === '1' ||
        window.localStorage.getItem('landmap:guest_mode') === '1');
    const user = readMockUser();

    if (user || isGuest) {
      router.replace(`/${locale}/dashboard`);
    } else {
      router.replace(`/${locale}/onboarding`);
    }
  }, [router, locale]);

  return null;
}
