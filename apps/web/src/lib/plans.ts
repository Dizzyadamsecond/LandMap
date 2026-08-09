// Plan tiers for LandMap — single source of truth (mirrors pricing/plans pages).
// Demo-mode: "paid" plan is selected in localStorage, never enforced server-side.

export type PlanId = 'free' | 'access' | 'plus' | 'business';

export const PLAN_TIER: Record<PlanId, number> = {
  free: 0,
  access: 1,
  plus: 2,
  business: 3,
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
      'Comparador básico de bairros',
    ],
  },
  {
    id: 'access',
    name: 'LandMap Access',
    priceBRL: 69.9,
    tagline: 'Mais acessível',
    highlight: false,
    features: [
      'Tudo do Free',
      'Comparador completo',
      'Alertas de oportunidade',
      'Relatórios básicos',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'plus',
    name: 'LandMap Plus',
    priceBRL: 119.9,
    tagline: 'MAIS POPULAR',
    highlight: true,
    features: [
      'Tudo do Access',
      'Radar de oportunidades LandMap',
      'Alertas inteligentes de valorização',
      'Alertas de queda de preço',
      'Ranking de oportunidades por cidade',
      'Comparação entre regiões',
      'Notas automáticas sobre potencial da área',
      'Salvar até 25 áreas favoritas',
    ],
  },
  {
    id: 'business',
    name: 'LandMap Business',
    priceBRL: 699.9,
    tagline: 'Time e operação',
    highlight: false,
    features: [
      'Tudo do Plus',
      'Usuários ilimitados',
      'White-label',
      'Integrações avançadas',
      'SLA de atendimento',
    ],
  },
];

export const PLAN_REQUIREMENTS: Record<string, PlanId> = {
  free: 'free',
  access: 'access',
  plus: 'plus',
  business: 'business',
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
