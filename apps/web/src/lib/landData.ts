// apps/web/src/lib/landData.ts
// Server-side loader para o ranking nacional de oportunidade de terreno.
// Usa dados REAIS do IBGE (municípios) + sinais macro REAIS do Bacen/SIDRA.
// Nunca simula dados de imóveis — usa faixas de referência de mercado BR
// documentadas e recalcula o score a cada tick com Selic/IPCA vivos.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BacenClient } from '@landmap/integrations';
import { SidraClient } from '@landmap/integrations';
import {
  rankLandOpportunities,
  DEFAULT_MACRO,
  type LandOpportunity,
  type MacroSignals,
  type Municipio,
} from '@landmap/invest';

interface MunicipiosFile {
  total: number;
  municipios: Municipio[];
}

const CANDIDATES = [
  join(process.cwd(), 'data', 'municipios-br.json'),
  join(process.cwd(), '..', '..', 'data', 'municipios-br.json'),
  join(__dirname, '..', '..', '..', 'data', 'municipios-br.json'),
  join(__dirname, '..', 'data', 'municipios-br.json'),
];

const CENTROID_CANDIDATES = [
  join(process.cwd(), 'data', 'uf-centroids.json'),
  join(process.cwd(), '..', '..', 'data', 'uf-centroids.json'),
  join(__dirname, '..', '..', '..', 'data', 'uf-centroids.json'),
];

let municipiosCache: Municipio[] | null = null;
let centroidsCache: Record<string, [number, number]> | null = null;

export function loadMunicipios(): Municipio[] {
  if (municipiosCache) return municipiosCache;
  for (const p of CANDIDATES) {
    if (existsSync(p)) {
      try {
        const parsed = JSON.parse(readFileSync(p, 'utf-8')) as MunicipiosFile;
        if (parsed.municipios?.length) {
          municipiosCache = parsed.municipios;
          return municipiosCache;
        }
      } catch {
        /* try next */
      }
    }
  }
  return [];
}

export function loadCentroids(): Record<string, [number, number]> {
  if (centroidsCache) return centroidsCache;
  for (const p of CENTROID_CANDIDATES) {
    if (existsSync(p)) {
      try {
        centroidsCache = JSON.parse(readFileSync(p, 'utf-8')) as Record<string, [number, number]>;
        return centroidsCache;
      } catch {
        /* try next */
      }
    }
  }
  return {};
}

/** Busca Selic (Bacen série 11) e IPCA (SIDRA 1736) REAIS. Fallback = last-known. */
export async function getMacroSignals(): Promise<{ macro: MacroSignals; live: boolean }> {
  const bacen = new BacenClient();
  const sidra = new SidraClient();
  try {
    const [selicRaw, ipcaRaw] = await Promise.all([
      bacen.getSelic(1),
      sidra.getSeries({ table: 1736, territory: '1', lastN: 1 }),
    ]);
    const selicValor = selicRaw?.[0]?.valor;
    const ipcaValor = ipcaRaw?.points?.[0]?.value;
    if (typeof selicValor === 'number' && Number.isFinite(selicValor)) {
      const macro: MacroSignals = {
        selic: selicValor / 100,
        ipca: typeof ipcaValor === 'number' && Number.isFinite(ipcaValor) ? ipcaValor / 100 : DEFAULT_MACRO.ipca,
        usdBrl: DEFAULT_MACRO.usdBrl,
      };
      return { macro, live: true };
    }
  } catch {
    /* network/parse failure -> last-known */
  }
  return { macro: DEFAULT_MACRO, live: false };
}

export interface LandSnapshot {
  generatedAt: string;
  live: boolean;
  coverage: { municipios: number; ufs: number; regioes: number };
  macro: MacroSignals;
  top: LandOpportunity[];
}

export async function buildLandSnapshot(limit = 40): Promise<LandSnapshot> {
  const municipios = loadMunicipios();
  const centroids = loadCentroids();
  const { macro, live } = await getMacroSignals();
  const top = rankLandOpportunities(municipios, centroids, macro, limit);

  const ufs = new Set(municipios.map((m) => m.uf));
  const regioes = new Set(municipios.map((m) => m.regiao));
  return {
    generatedAt: new Date().toISOString(),
    live,
    coverage: { municipios: municipios.length, ufs: ufs.size, regioes: regioes.size },
    macro,
    top,
  };
}
