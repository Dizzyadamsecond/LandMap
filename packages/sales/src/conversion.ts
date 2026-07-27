/**
 * Lead Conversion Model — LandMap
 *
 * Algoritmo de PROBABILIDADE DE CONVERSÃO (0–1) e PERFIL DE USUÁRIO
 * adaptativo. É o cérebro que decide "quanto follow-up vale a pena gastar"
 * em cada lead, maximizando conversão sem desperdiçar esforço em leads frios.
 *
 * Sem dependências externas — roda em Node (Vercel cron) e pode ser testado.
 */

import type { Lead, Deal, PipelineStage, SalesChannel } from './types.js';

/* ─── Perfil de usuário (vetor de interesse + sinais comportamentais) ─── */

export interface UserProfile {
  leadId: string;
  interestVector: Record<string, number>;
  intent: number;
  engagement: number;
  lastActivityAt?: string;
  preferredChannel?: SalesChannel;
  followUpToleranceDays: number;
}

const DEFAULT_INTEREST_KEYS = [
  'apartamento',
  'casa',
  'terreno',
  'comercial',
  'investimento',
  'valorizacao',
  'aluguel',
  'loteamento',
];

function normalizeInterest(interest: string): Record<string, number> {
  const v: Record<string, number> = {};
  for (const k of DEFAULT_INTEREST_KEYS) v[k] = 0;
  const text = interest.toLowerCase();
  for (const k of DEFAULT_INTEREST_KEYS) {
    if (text.includes(k)) v[k] = 1;
  }
  if (/\d/.test(text) || text.includes('r$') || text.includes('bairro') || text.includes('cidade')) {
    v['investimento'] = Math.min(1, (v['investimento'] ?? 0) + 0.5);
  }
  return v;
}

export function buildProfile(lead: Lead): UserProfile {
  const intent = Math.min(
    1,
    (lead.signals?.length ?? 0) * 0.18 + (lead.score ?? 0) / 200 + (lead.engagementCount ?? 0) * 0.05,
  );
  return {
    leadId: lead.id,
    interestVector: normalizeInterest(lead.interest ?? ''),
    intent,
    engagement: lead.engagementCount ?? 0,
    lastActivityAt: lead.createdAt,
    followUpToleranceDays: Math.round(3 + intent * 11),
  };
}

/* ─── Probabilidade de conversão (0–1) ─── */

export interface ConversionInputs {
  score: number;
  stage: PipelineStage;
  engagement: number;
  daysSinceActivity: number;
  intent: number;
  followUpsSent: number;
  toleranceDays: number;
  channelFit: number;
}

const STAGE_BASE: Record<PipelineStage, number> = {
  captured: 0.05,
  contacted: 0.12,
  qualified: 0.28,
  scheduled: 0.5,
  proposal: 0.68,
  negotiation: 0.82,
  closed_won: 1,
  closed_lost: 0,
};

export function conversionProbability(x: ConversionInputs): number {
  const fit = clamp01(x.score / 100) * 0.35;
  const stage = STAGE_BASE[x.stage] * 0.3;
  const eng = clamp01(Math.log10(x.engagement + 1) / 2) * 0.12;
  const recency = clamp01(1 - x.daysSinceActivity / 30) * 0.08;
  const engagementRecency = eng + recency;
  const intentChannel = clamp01(x.intent) * 0.1 + x.channelFit * 0.05;
  let p = fit + stage + engagementRecency + intentChannel;
  const excess = x.followUpsSent - x.toleranceDays;
  if (excess > 0) {
    p *= Math.max(0.4, 1 - excess * 0.06);
  }
  return round2(clamp01(p));
}

/* ─── Decisão de follow-up orientada por propensão ─── */

export type FollowUpVerdict = 'aggressive' | 'normal' | 'light' | 'pause';

export interface FollowUpDecision {
  verdict: FollowUpVerdict;
  effort: number;
  nextDelayHours: number;
  reason: string;
}

export function decideFollowUp(
  probability: number,
  profile: UserProfile,
  followUpsSent: number,
): FollowUpDecision {
  const tol = profile.followUpToleranceDays;
  if (probability >= 0.6) {
    return { verdict: 'aggressive', effort: 1, nextDelayHours: 12, reason: `Alta propensão (${(probability * 100).toFixed(0)}%): follow-up agressivo, curto intervalo.` };
  }
  if (probability >= 0.35) {
    return { verdict: 'normal', effort: 0.6, nextDelayHours: 48, reason: `Propensão média (${(probability * 100).toFixed(0)}%): cadência padrão D+1/D+3/D+7.` };
  }
  if (probability >= 0.15) {
    return { verdict: 'light', effort: 0.3, nextDelayHours: 120, reason: `Propensão baixa (${(probability * 100).toFixed(0)}%): toque leve, espaçado.` };
  }
  if (followUpsSent < tol) {
    return { verdict: 'light', effort: 0.2, nextDelayHours: 168, reason: `Frio (${(probability * 100).toFixed(0)}%) mas dentro da tolerância (${tol}d): 1 toque semanal.` };
  }
  return { verdict: 'pause', effort: 0, nextDelayHours: 720, reason: `Frio e acima da tolerância (${followUpsSent}/${tol}): PAUSE para não queimar o lead.` };
}

export function dealConversion(deal: Deal, daysSinceActivity: number): number {
  const base = STAGE_BASE[deal.stage];
  const recency = clamp01(1 - daysSinceActivity / 30) * 0.1;
  const p = clamp01(deal.probability) * 0.7 + base * 0.2 + recency;
  return round2(clamp01(p));
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
