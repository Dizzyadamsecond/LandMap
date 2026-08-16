'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * /map route — Paridade 1:1 com Lovable (_authenticated/map.tsx):
 * Redireciona diretamente para /dashboard onde o Mapa interativo reside.
 */
export default function MapRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  useEffect(() => {
    router.replace(`/${locale}/dashboard`);
  }, [router, locale]);

  return null;
}
