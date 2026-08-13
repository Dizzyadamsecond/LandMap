// Plan tiers for LandMap — single source of truth (mirrors pricing/plans pages).
// Paridade LITERAL com o Lovable live (reference-lovable/src/routes/plans.tsx):
// Access R$69,90 · Plus R$119,90 (destaque) · Pro R$249,90 · Business R$699,90.
// Demo-mode: "paid" plan is selected in localStorage, never enforced server-side.
// 'free' permanece como plano de referência (regra CLAUDE.md: no-paywall).

export type PlanId = 'free' | 'access' | 'plus' | 'pro' | 'business';

export const PLAN_TIER: Record<PlanId, number> = {
  free: 0,
  access: 1,
  plus: 2,
  pro: 3,
  business: 4,
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
    id: 'access',
    name: 'LandMap Access',
    priceBRL: 69.9,
    tagline: 'Comece com o essencial',
    highlight: false,
    features: [
      'Acesso a todas as cidades do Brasil',
      'Mapa de valorização e desvalorização',
      'Mapa de calor básico',
      'Ranking das regiões mais valorizadas',
      'Ranking das regiões em queda',
      'Histórico de preço por m²',
      'Busca por bairro, cidade e região',
      'Salvar até 10 áreas favoritas',
      'Tendência: subindo, estável ou caindo',
    ],
  },
  {
    id: 'plus',
    name: 'LandMap Plus',
    priceBRL: 119.9,
    tagline: 'Mais popular',
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
    id: 'pro',
    name: 'LandMap Pro',
    priceBRL: 249.9,
    tagline: 'Para profissionais',
    highlight: false,
    features: [
      'Tudo do Plus',
      'Acompanhar áreas monitoradas (salvas)',
      'Salvar até 50 regiões favoritas',
      'Histórico completo da área',
      'Relatório mensal geral',
      'Avaliação do seu terreno',
    ],
  },
  {
    id: 'business',
    name: 'LandMap Business',
    priceBRL: 699.9,
    tagline: 'Para equipes',
    highlight: false,
    features: [
      'Tudo do Pro',
      'Até 5 usuários',
      'Painel de equipe',
      'Relatório com marca da empresa',
      'Histórico de análise da equipe',
    ],
  },
];

/** Plano gratuito (referência; NÃO exibido no grid de /plans — Lovable live não tem Free no grid). */
export const FREE_PLAN: PlanMeta = {
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
};

export const PLAN_REQUIREMENTS: Record<string, PlanId> = {
  free: 'free',
  access: 'access',
  plus: 'plus',
  pro: 'pro',
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
