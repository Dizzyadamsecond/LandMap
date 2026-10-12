'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { readMockUser } from '../lib/mockAuth';

/**
 * Gate de autenticação (1:1 com Lovable _authenticated/route.tsx).
 * Se o usuário não estiver logado e não tiver guest_mode === '1', redireciona para /auth.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const isGuest =
      typeof window !== 'undefined' &&
      (window.localStorage.getItem('guest_mode') === '1' ||
        window.localStorage.getItem('landmap:guest_mode') === '1');
    const user = readMockUser();
    const isAuthed = (user && user.provider !== 'guest') || isGuest;

    if (!isAuthed) {
      router.replace(`/${locale}/auth`);
    } else {
      setAuthorized(true);
    }
  }, [router, locale]);

  if (authorized === false || authorized === null) {
    return null;
  }

  return <>{children}</>;
}
