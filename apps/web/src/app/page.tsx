'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMockUser } from '@/lib/mockAuth';

export default function RootRedirect() {
  const router = useRouter();
  const { user } = useMockUser();

  useEffect(() => {
    // Exatamente como Lovable:
    // Se autenticado (ou guest mode) → /pt-BR/dashboard
    // Se NÃO autenticado → /pt-BR/onboarding
    if (user) {
      router.replace('/pt-BR/dashboard');
    } else {
      router.replace('/pt-BR/onboarding');
    }
  }, [user, router]);

  return null;
}
