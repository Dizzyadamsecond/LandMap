'use client';

import { useEffect, useState } from 'react';

export interface UserProgress {
  user_id: string;
  xp: number;
  level: number;
  tier: 'bronze' | 'silver' | 'gold' | 'sovereign';
  landcoins: number;
  metrics: {
    searches: number;
    favoritesSaved: number;
    comparisonsMade: number;
    agentCycles: number;
    neighborhoodsExplored: number;
    referrals: number;
    dealsClosed: number;
  };
  streak: {
    current: number;
    best: number;
    lastActiveDate: string | null;
    freezes: number;
  };
  badges: string[];
  updated_at: string;
}

export function useProgress(userId?: string) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const res = await (globalThis as any).fetch(`/api/gamification/progress/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch progress');
        const data = await res.json();
        setProgress(data);
      } catch (e) {
        console.error('Progress fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  const reportEvent = async (type: string, amount?: number) => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/gamification/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || 'guest' },
        body: JSON.stringify({ type, amount }),
      });
      if (!res.ok) throw new Error('Failed to report event');
      // Refetch progress
      if (userId) {
        const res2 = await fetch(`/api/gamification/progress/${userId}`);
        if (res2.ok) {
          const data = await res2.json();
          setProgress(data);
        }
      }
    } catch (e) {
      console.error('Event report error:', e);
    }
  };

  return { progress, loading, reportEvent };
}
