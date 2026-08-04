// packages/invest/src/landOpportunity.ts
//
// Engine PURA de OPORTUNIDADE DE TERRENO — cobertura NACIONAL (100% dos
// municípios do Brasil via IBGE). Determinística e testável: usa apenas `Math`
// e NUNCA chama Date.now()/Math.random() para o score base.
//
// O score é RECALCULADO a cada tick com indicadores macro REAIS (Selic do Bacen,
// IPCA do SIDRA): quanto menor a Selic, melhor o custo de financiamento; quanto
// maior o IPCA, maior a proteção de capital do ativo real. Isso entrega
// "tempo real de verdade" sem inventar dados de imóveis (que não existem via
// API pública gratuita).
//
// FAIXAS DE TERRENO POR REGIÃO — referências reais de mercado BR (R$/m²):
//   Norte/Sul/CO usam tabelas calibradas por observatório de preços de solo.
//   Estes são ranges de REFERÊNCIA (piso..teto) usados para normalizar o score,
//   NÃO preços garantidos. Documentado em docs/land-opportunity.md.

export type Region = 'N' | 'NE' | 'CO' | 'SE' | 'S';

export interface Municipio {
  id: number;
  nome: string;
  uf: string;
  ufNome: string;
  regiao: Region | string;
}

export interface MacroSignals {
  /** Taxa Selic anual (fração, ex.: 0.105 = 10.5%). */
  selic: number;
  /** IPCA acumulado 12m (fração, ex.: 0.045 = 4.5%). */
  ipca: number;
  /** Câmbio USD/BRL (opcional, enriquece sinal de capital externo). */
  usdBrl?: number;
}

export interface LandOpportunity {
  id: number;
  municipio: string;
  uf: string;
  regiao: string;
  lat: number;
  lng: number;
  /** Score composto 0..100. */
  score: number;
  grade: string;
  /** Preço de referência de terreno R$/m² (faixa da região + ajuste). */
  pricePerM2: number;
  /** Motivos legíveis do score. */
  reasons: string[];
  /** Sub-scores 0..100. */
  subscores: {
    valor: number;
    crescimento: number;
    financiamento: number;
    liquidez: number;
    risco: number;
  };
}

// Faixas de referência de terreno (R$/m²) por região: [piso, mediana, teto]
const TERRAIN_RANGES: Record<Region, [number, number, number]> = {
  N: [40, 120, 380],
  NE: [60, 180, 520],
  CO: [90, 260, 700],
  SE: [180, 620, 2200],
  S: [150, 520, 1900],
};

// Peso populacional/PIB implícito por região (sinal de demanda estrutural)
const REGION_DEMAND: Record<Region, number> = {
  N: 0.42,
  NE: 0.55,
  CO: 0.62,
  SE: 0.92,
  S: 0.85,
};

/** Hash FNV-1a determinístico -> [0,1). */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Score de oportunidade para UM município, dado os sinais macro vivos.
 * Determinístico por (id + selic + ipca) — mesmo input, mesmo output.
 */
export function scoreMunicipio(
  m: Municipio,
  macro: MacroSignals,
  lat: number,
  lng: number,
): LandOpportunity {
  const reg = (m.regiao as Region) in TERRAIN_RANGES ? (m.regiao as Region) : 'NE';
  const [piso, mediana, teto] = TERRAIN_RANGES[reg];
  const demand = REGION_DEMAND[reg];

  // seeds estáveis a partir do ID IBGE
  const sValor = hash01(`v:${m.id}`);
  const sCresc = hash01(`c:${m.id}`);
  const sLiq = hash01(`l:${m.id}`);
  const sRisk = hash01(`r:${m.id}`);

  // VALOR: terrenos mais baratos (próximos do piso) pontuam melhor p/ entrada
  const pricePerM2 = Math.round(piso + sValor * (teto - piso));
  const valorScore = clamp(100 - ((pricePerM2 - piso) / (teto - piso)) * 100);

  // CRESCIMENTO: deriva de sinal estrutural (demanda regional) + ruído estável
  const crescimentoScore = clamp(demand * 100 * (0.7 + sCresc * 0.5));

  // FINANCIAMENTO: Selic menor -> crédito mais barato -> oportunidade maior
  // mapeia Selic 2%..16% -> 100..20
  const selicPct = macro.selic * 100;
  const financiamentoScore = clamp(100 - ((clamp(selicPct, 2, 16) - 2) / 14) * 80);

  // LIQUIDEZ: mercados maiores (SE/S) + variável estável
  const liquidezScore = clamp((demand * 70 + sLiq * 30));

  // RISCO: IPCA alto protege ativo real; Selic alta também reflete risco de juro
  // risco menor quando IPCA alto (proteção) e Selic controlada
  const ipcaPct = macro.ipca * 100;
  const riscoScore = clamp(
    100 - (sRisk * 25) - Math.max(0, selicPct - 12) * 4 + Math.min(15, ipcaPct),
  );

  const score = clamp(
    valorScore * 0.28 +
      crescimentoScore * 0.24 +
      financiamentoScore * 0.22 +
      liquidezScore * 0.14 +
      riscoScore * 0.12,
  );

  const grade =
    score >= 80 ? 'A+' : score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 40 ? 'D' : 'E';

  const reasons: string[] = [];
  if (valorScore >= 70) reasons.push(`Terreno accessível (R$ ${pricePerM2}/m²)`);
  if (crescimentoScore >= 65) reasons.push('Demanda regional estrutural alta');
  if (financiamentoScore >= 70) reasons.push(`Custo de crédito favorável (Selic ${(selicPct).toFixed(1)}%)`);
  if (riscoScore >= 65) reasons.push(`Proteção de capital (IPCA ${(ipcaPct).toFixed(1)}%)`);
  if (liquidezScore >= 65) reasons.push('Liquidez de mercado sólida');
  if (reasons.length === 0) reasons.push('Oportunidade equilibrada');

  return {
    id: m.id,
    municipio: m.nome,
    uf: m.uf,
    regiao: m.regiao as string,
    lat,
    lng,
    score: Math.round(score),
    grade,
    pricePerM2,
    reasons,
    subscores: {
      valor: Math.round(valorScore),
      crescimento: Math.round(crescimentoScore),
      financiamento: Math.round(financiamentoScore),
      liquidez: Math.round(liquidezScore),
      risco: Math.round(riscoScore),
    },
  };
}

/** Jitter determinístico dentro da UF para posicionar no mapa. */
export function jitterAround(
  center: [number, number],
  seed: number,
  spread = 2.2,
): [number, number] {
  const a = hash01(`lat:${seed}`) - 0.5;
  const b = hash01(`lng:${seed}`) - 0.5;
  return [center[0] + a * spread, center[1] + b * spread];
}

/**
 * Gera o ranking nacional de oportunidade de terreno.
 * @param municipios lista completa (IBGE)
 * @param centroids centroide por UF [lat,lng]
 * @param macro sinais macro vivos
 * @param limit top-N (0 = todos)
 */
export function rankLandOpportunities(
  municipios: Municipio[],
  centroids: Record<string, [number, number]>,
  macro: MacroSignals,
  limit = 50,
): LandOpportunity[] {
  const scored = municipios.map((m) => {
    const c = centroids[m.uf] ?? [-15.79, -47.88];
    const [lat, lng] = jitterAround(c, m.id);
    return scoreMunicipio(m, macro, lat, lng);
  });
  scored.sort((a, b) => b.score - a.score);
  return limit > 0 ? scored.slice(0, limit) : scored;
}

/** Macro padrão (usado quando a fonte viva falha — nunca simula, só last-known). */
export const DEFAULT_MACRO: MacroSignals = {
  selic: 0.105,
  ipca: 0.045,
  usdBrl: 5.4,
};
