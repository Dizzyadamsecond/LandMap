'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readMockUser } from '@/lib/mockAuth';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const isGuest =
      typeof window !== 'undefined' &&
      (window.localStorage.getItem('guest_mode') === '1' ||
        window.localStorage.getItem('landmap:guest_mode') === '1');
    const user = readMockUser();
    const isAuthenticated = !!user || isGuest;

    if (isAuthenticated) {
      router.replace('/pt-BR/dashboard');
    } else {
      router.replace('/pt-BR/onboarding');
    }
  }, [router]);

  return null;
}
