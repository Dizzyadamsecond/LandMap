// packages/invest/src/landOpportunity.spec.ts
import { describe, it, expect } from 'vitest';
import {
  hash01,
  scoreMunicipio,
  rankLandOpportunities,
  type MacroSignals,
  type Municipio,
} from './landOpportunity';

const MACRO: MacroSignals = { selic: 0.105, ipca: 0.045, usdBrl: 5.4 };

function muni(over: Partial<Municipio> = {}): Municipio {
  return { id: 3550308, nome: 'São Paulo', uf: 'SP', ufNome: 'São Paulo', regiao: 'SE', ...over };
}

const CENTROIDS: Record<string, [number, number]> = {
  SP: [-23.55, -46.63],
  RO: [-10.83, -63.34],
  AC: [-8.77, -70.55],
};

describe('hash01', () => {
  it('é determinístico e cai em [0,1)', () => {
    const a = hash01('v:3550308');
    const b = hash01('v:3550308');
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('difere para seeds distintas', () => {
    expect(hash01('v:1')).not.toBe(hash01('v:2'));
  });
});

describe('scoreMunicipio', () => {
  it('é puro: mesmo (id, macro) -> mesmo score', () => {
    const m = muni();
    const r1 = scoreMunicipio(m, MACRO, -23.55, -46.63);
    const r2 = scoreMunicipio(m, MACRO, -23.55, -46.63);
    expect(r1.score).toBe(r2.score);
    expect(r1.pricePerM2).toBe(r2.pricePerM2);
    expect(r1.subscores).toEqual(r2.subscores);
  });

  it('não usa Date.now()/Math.random no score base', () => {
    // duas chamadas em instantes diferentes produzem score idêntico
    const m = muni({ id: 1100015 });
    const s1 = scoreMunicipio(m, MACRO, -10.83, -63.34).score;
    const s2 = scoreMunicipio(m, MACRO, -10.83, -63.34).score;
    expect(s1).toBe(s2);
  });

  it('score e grade dentro das faixas esperadas', () => {
    const o = scoreMunicipio(muni(), MACRO, -23.55, -46.63);
    expect(o.score).toBeGreaterThanOrEqual(0);
    expect(o.score).toBeLessThanOrEqual(100);
    expect(['A+', 'A', 'B', 'C', 'D', 'E']).toContain(o.grade);
    expect(o.reasons.length).toBeGreaterThan(0);
  });

  it('menor Selic melhora o subscore de financiamento', () => {
    const m = muni({ id: 4200000 });
    const baixa = scoreMunicipio(m, { selic: 0.02, ipca: 0.045 }, -23, -50);
    const alta = scoreMunicipio(m, { selic: 0.16, ipca: 0.045 }, -23, -50);
    expect(baixa.subscores.financiamento).toBeGreaterThan(alta.subscores.financiamento);
  });
});

describe('rankLandOpportunities', () => {
  const municipios: Municipio[] = [
    muni({ id: 3550308, nome: 'São Paulo', uf: 'SP', regiao: 'SE' }),
    muni({ id: 1100015, nome: "Alta Floresta D'Oeste", uf: 'RO', regiao: 'N' }),
    muni({ id: 1200013, nome: 'Rio Branco', uf: 'AC', regiao: 'N' }),
  ];

  it('retorna ranking decrescente por score', () => {
    const top = rankLandOpportunities(municipios, CENTROIDS, MACRO, 3);
    expect(top).toHaveLength(3);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].score).toBeGreaterThanOrEqual(top[i].score);
    }
  });

  it('limit respeita top-N', () => {
    const top = rankLandOpportunities(municipios, CENTROIDS, MACRO, 2);
    expect(top).toHaveLength(2);
  });

  it('posiciona por centroide da UF (jitter determinístico)', () => {
    const top = rankLandOpportunities(municipios, CENTROIDS, MACRO, 0);
    const sp = top.find((o) => o.uf === 'SP')!;
    expect(Math.abs(sp.lat + 23.55)).toBeLessThan(2.5);
    expect(Math.abs(sp.lng + 46.63)).toBeLessThan(2.5);
  });
});
