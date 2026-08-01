// Plan tiers for LandMap — single source of truth (mirrors pricing/plans pages).
// Demo-mode: "paid" plan is selected in localStorage, never enforced server-side.

export type PlanId = 'free' | 'access' | 'plus' | 'pro' | 'business';

export const PLAN_TIER: Record<PlanId, number> = {
  free: 0,
  access: 0,
  plus: 0,
  pro: 0,
  business: 0,
};

export type PlanMeta = {
  id: PlanId;
  name: string;
  priceBRL: number;
  tagline: string;
  highlight?: boolean;
  features?: string[];
};

export const PLANS: PlanMeta[] = [
  {
    id: 'free',
    name: 'LandMap Free',
    priceBRL: 0,
    tagline: 'Comece sem custo',
    highlight: true,
    features: [
      'Mapa básico de valorização',
      'Ranking de regiões',
      'Histórico simplificado',
      'Até 5 favoritos',
    ],
  },
];

export const PLAN_REQUIREMENTS: Record<string, PlanId> = {
  free: 'free',
  access: 'free',
  plus: 'free',
  pro: 'free',
  business: 'free',
};

export function planTier(plan: PlanId | undefined | null): number {
  return PLAN_TIER[plan ?? 'free'] ?? 0;
}

/** Has the user reached (or exceeded) the required plan tier? */
export function hasPlan(plan: PlanId | undefined | null, required: PlanId): boolean {
  return planTier(plan) >= PLAN_TIER[required];
}

export function planMeta(id: PlanId): PlanMeta | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function requirementFor(id: string): PlanId {
  return PLAN_REQUIREMENTS[id] ?? 'free';
}
