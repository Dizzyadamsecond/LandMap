// Plan tiers for LandMap — single source of truth (mirrors pricing/plans pages).
// Demo-mode: "paid" plan is selected in localStorage, never enforced server-side.

export type PlanId = 'free' | 'starter' | 'pro' | 'elite';

export const PLAN_TIER: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
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
    id: 'starter',
    name: 'LandMap Starter',
    priceBRL: 39.9,
    tagline: 'Para quem está começando',
    highlight: false,
    features: [
      'Mapa de calor',
      'Histórico do preço por m²',
      'Tendências de valorização',
      'Busca por cidade, bairro e região',
      'Ranking das regiões',
      'Até 10 áreas favoritas',
    ],
  },
  {
    id: 'pro',
    name: 'LandMap Pro',
    priceBRL: 89.9,
    tagline: 'Mais popular',
    highlight: true,
    features: [
      'Tudo do Starter',
      'Radar de oportunidades',
      'Comparação entre regiões',
      'Alertas inteligentes',
      'Alertas de valorização',
      'Alertas de queda de preço',
      'Histórico completo da área',
      'Avaliação automática do terreno',
      'Relatórios mensais',
      'Até 50 áreas favoritas',
    ],
  },
  {
    id: 'elite',
    name: 'LandMap Elite',
    priceBRL: 119.9,
    tagline: 'Máxima inteligência',
    highlight: false,
    features: [
      'Tudo do Pro',
      'IA explicando o potencial da região',
      'Score LandMap',
      'Exportação em PDF',
      'Exportação em Excel',
      'Relatórios ilimitados',
      'Favoritos ilimitados',
      'Acesso antecipado a novas funcionalidades',
      'Suporte prioritário',
    ],
  },
  {
    id: 'free',
    name: 'LandMap Free',
    priceBRL: 0,
    tagline: 'Comece sem custo',
    highlight: false,
    features: [
      'Mapa de calor',
      'Histórico do preço por m²',
      'Tendências de valorização',
      'Busca por cidade, bairro e região',
      'Ranking das regiões',
      'Até 10 áreas favoritas',
    ],
  },
];

export const PLAN_REQUIREMENTS: Record<string, PlanId> = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  elite: 'elite',
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
