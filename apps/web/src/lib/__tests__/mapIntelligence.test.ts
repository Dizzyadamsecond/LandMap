import { describe, it, expect } from 'vitest';
import {
  COPY,
  INTELLIGENCE_REGIONS,
  INTELLIGENCE_LAYERS,
  scoreLabel,
  scoreColor,
  heatScaleGradient,
  layerValue,
  topByScore,
  topByValorization,
  filterRegions,
  fmtDelta,
  fmtPriceSqm,
} from '../mapIntelligence';

describe('mapIntelligence — data integrity', () => {
  it('has exactly 8 intelligence layers', () => {
    expect(INTELLIGENCE_LAYERS).toHaveLength(8);
  });

  it('has at least 9 regions, all with required fields', () => {
    expect(INTELLIGENCE_REGIONS.length).toBeGreaterThanOrEqual(9);
    for (const r of INTELLIGENCE_REGIONS) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.layerScores).toBeTruthy();
      expect(Object.keys(r.layerScores)).toHaveLength(8);
      expect(r.priceHistory).toBeInstanceOf(Array);
      expect(r.highlights).toBeInstanceOf(Array);
      expect(r.timeline).toBeInstanceOf(Array);
      expect(typeof r.priceSqm).toBe('number');
      expect(typeof r.population).toBe('number');
      expect(typeof r.incomeAvg).toBe('number');
      expect(typeof r.hdi).toBe('number');
      expect(Array.isArray(r.zoning)).toBe(false);
      expect(typeof r.environmentalRisk).toBe('string');
      expect(typeof r.floodRisk).toBe('string');
    }
  });

  it('every region has real Brazilian coordinates', () => {
    for (const r of INTELLIGENCE_REGIONS) {
      // Brazil boundaries: Latitude (-34 to +6), Longitude (-74 to -34)
      expect(r.lat).toBeGreaterThan(-34);
      expect(r.lat).toBeLessThan(6);
      expect(r.lng).toBeGreaterThan(-74);
      expect(r.lng).toBeLessThan(-34);
    }
  });
});

describe('scoreLabel — band alignment', () => {
  it.each([
    [20, 'Crítico'],
    [35, 'Baixo'],
    [50, 'Médio'],
    [65, 'Alto potencial'],
    [85, 'Excepcional'],
  ])('score %i -> %s', (score, label) => {
    expect(scoreLabel(score)).toBe(label);
  });
});

// scoreColor alinhado à paleta Lovable RED-YELLOW-BLUE (#dc2626, #f97316, #eab308, #3b82f6, #003594)
describe('scoreColor — band thresholds', () => {
  it.each([
    [20, '#dc2626'], // <35 critical (RED)
    [40, '#f97316'], // 35-49 low (ORANGE)
    [55, '#eab308'], // 50-64 medium (YELLOW)
    [70, '#3b82f6'], // 65-79 high potential (BLUE)
    [90, '#003594'], // >=80 exceptional (DARK BLUE)
  ])('score %i -> %s', (score, expected) => {
    expect(scoreColor(score)).toBe(expected);
  });

  it('returns distinct tokens across bands (critical vs exceptional)', () => {
    expect(scoreColor(20)).not.toBe(scoreColor(90));
  });
});

describe('ranking helpers', () => {
  it('topByValorization returns 3 sorted desc by delta', () => {
    const top = topByValorization(3);
    expect(top).toHaveLength(3);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].priceSqmDelta12m).toBeGreaterThanOrEqual(top[i].priceSqmDelta12m);
    }
  });

  it('topByScore returns 3 sorted desc by score', () => {
    const top = topByScore(3);
    expect(top).toHaveLength(3);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].score).toBeGreaterThanOrEqual(top[i].score);
    }
  });

  it('filterRegions is case-insensitive on name', () => {
    const found = filterRegions('meireles');
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].id).toBe('meireles');
    expect(filterRegions('zzz-nope')).toHaveLength(0);
  });
});

describe('formatters', () => {
  it('fmtDelta renders percent with sign', () => {
    expect(fmtDelta(12.4)).toContain('%');
    expect(fmtDelta(-3.1)).toContain('-');
  });
  it('fmtPriceSqm renders BRL', () => {
    expect(fmtPriceSqm(8500)).toContain('R$');
  });
});

describe('COPY keys used by map/page exist', () => {
  const USED = [
    'score', 'scoreHint', 'topValorization', 'topOpportunities', 'indexFlow',
    'hottest', 'historyRange', 'avgPrice', 'population', 'income', 'idh',
    'zoning', 'envRisk', 'floodRisk', 'failMap', 'layersTitle', 'heat',
    'heatScale', 'critical', 'medium', 'exceptional', 'composition',
    'compare', 'regions', 'stateRank', 'nationalRank', 'last7Years', 'history',
  ];
  it.each(USED)('COPY.%s is defined', (k) => {
    expect((COPY as Record<string, string>)[k]).toBeTruthy();
  });
});
