'use client';

import { useEffect, useState } from 'react';
import { MockUser, readMockUser } from './mockAuth';
import { hasPlan, PlanId, planMeta } from './plans';

export type PlanState = {
  user: MockUser | null;
  plan: PlanId;
  /** Demo-mode upgrade (localStorage only). */
  upgrade: (plan: PlanId) => void;
  /** Demo-mode downgrade. */
  reset: () => void;
  has: (required: PlanId) => boolean;
  planName: string;
};

const PLAN_KEY = 'landmap:selected_plan';

function readPlan(): PlanId {
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (raw === 'free') return 'free';
  } catch {
    /* ignore */
  }
  return 'free';
}

function writePlan(plan: PlanId) {
  try {
    window.localStorage.setItem(PLAN_KEY, plan);
  } catch {
    /* ignore */
  }
}

/** plan = backend subscription tier (real), fallback to localStorage (demo). */
export function usePlan(): PlanState {
  const [user, setUser] = useState<MockUser | null>(null);
  const [plan, setPlan] = useState<PlanId>('free');

  useEffect(() => {
    const u = readMockUser();
    setUser(u);

    const fetchRealPlan = async () => {
      try {
        const userId = u?.id || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
        if (!userId) {
          const stored = readPlan();
          setPlan(stored !== 'free' ? stored : (u?.plan as PlanId) ?? 'free');
          return;
        }

        const res = await fetch('/api/billing/subscription', {
          headers: { 'x-user-id': userId }
        });

        if (!res.ok) throw new Error('failed to fetch subscription');

        const data = await res.json();
        setPlan((data.tier as PlanId) || 'free');
      } catch (e) {
        const stored = readPlan();
        setPlan(stored !== 'free' ? stored : (u?.plan as PlanId) ?? 'free');
      }
    };

    fetchRealPlan();
  }, []);

  const upgrade = (next: PlanId) => {
    writePlan(next);
    setPlan(next);
    if (user) {
      try {
        const updated = { ...user, plan: next };
        window.localStorage.setItem('landmap_mock_user', JSON.stringify(updated));
        setUser(updated);
      } catch {
        /* ignore */
      }
    }
  };

  const reset = () => {
    writePlan('free');
    setPlan('free');
  };

  return {
    user,
    plan,
    upgrade,
    reset,
    has: (required) => hasPlan(plan, required),
    planName: planMeta(plan)?.name ?? 'LandMap Grátis',
  };
}
