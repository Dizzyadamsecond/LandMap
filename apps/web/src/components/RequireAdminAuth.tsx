'use client';

import { useEffect, type ReactNode } from 'react';
import { ensureFreeAccess, readMockUser } from '../lib/mockAuth';
import { useRouter } from 'next/navigation';

/**
 * Admin authentication wrapper.
 * Ensures user is logged in before accessing admin features.
 * In production, this would check actual admin roles from Supabase.
 */
export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Ensure free access is granted
    ensureFreeAccess();

    // In production, would validate admin role here
    // For now, just ensure user exists
    const user = readMockUser();
    if (!user) {
      // Redirect to auth if no session
      router.push('/auth');
    }
  }, [router]);

  return <>{children}</>;
}
