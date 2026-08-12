/**
 * History40 — 40 anos de séries macroeconômicas reais (Bacen SGS), prontas
 * para streaming via WebSocket/SSE.
 *
 * Dados: data/history40/bacen.json (baixado via API SGS do Bacen — CDI, IPCA,
 * INPC, IGP-M, IGP-DI, INCC-DI, Selic acumulada, IPCA-15; 1986→hoje, real).
 *
 * O stream emite:
 *   { type: 'history40.snapshot', series, meta, generatedAt }   (no connect)
 *   { type: 'history40.tick',     series: {cdi, ipca, selic...}, ts } (a cada N s)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type SeriesPoint = { date: string; value: number };
export type SeriesMap = Record<string, SeriesPoint[]>;

export interface History40Snapshot {
  type: 'history40.snapshot';
  series: SeriesMap;
  meta: {
    source: string;
    start: string;
    end: string;
    totalPoints: number;
    seriesCount: number;
  };
  generatedAt: string;
}

export interface History40Tick {
  type: 'history40.tick';
  series: Record<string, { value: number; date: string; changePct?: number }>;
  ts: string;
}

function dataPath(file: string): string {
  const candidates = [
    join(process.cwd(), 'data', 'history40', file),
    join(process.cwd(), '..', 'data', 'history40', file),
    join(process.cwd(), '..', '..', 'data', 'history40', file),
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  return candidates[0];
}

let cached: SeriesMap | null = null;

export function loadSeries(): SeriesMap {
  if (cached) return cached;
  const p = dataPath('bacen.json');
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8')) as Record<string, SeriesPoint[]>;
    cached = Object.fromEntries(
      Object.entries(raw).map(([k, pts]) => [
        k,
        (pts || [])
          .filter((pt) => pt && typeof pt.date === 'string' && typeof pt.value === 'number')
          .map((pt) => ({ date: pt.date, value: pt.value })),
      ]),
    );
    return cached;
  } catch {
    cached = {};
    return cached;
  }
}

export function seriesCount(): number {
  return Object.keys(loadSeries()).length;
}

export function buildSnapshot(): History40Snapshot {
  const series = loadSeries();
  const all = Object.values(series).flat();
  const dates = all.map((p) => p.date).sort();
  return {
    type: 'history40.snapshot',
    series,
    meta: {
      source: 'Bacen SGS (api.bcb.gov.br) — séries oficiais, sem chave',
      start: dates[0] ?? '',
      end: dates[dates.length - 1] ?? '',
      totalPoints: all.length,
      seriesCount: seriesCount(),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function buildTick(): History40Tick {
  const series = loadSeries();
  const out: History40Tick['series'] = {};
  for (const [name, pts] of Object.entries(series)) {
    if (!pts.length) continue;
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    out[name] = {
      value: last.value,
      date: last.date,
      changePct: prev ? ((last.value - prev.value) / Math.abs(prev.value || 1)) * 100 : undefined,
    };
  }
  return { type: 'history40.tick', series: out, ts: new Date().toISOString() };
}

/** Human labels per series (pt-BR) — used by UI. */
export const SERIES_LABELS: Record<string, string> = {
  cdi: 'CDI (acumulado mês, %)',
  ipca: 'IPCA — inflação (%)',
  inpc: 'INPC (%)',
  igpm: 'IGP-M (%)',
  igpdi: 'IGP-DI (%)',
  inccdi: 'INCC-DI — construção (%)',
  selic_acum: 'Selic acumulada (%)',
  ipca15: 'IPCA-15 (%)',
  cambio_usd: 'Câmbio USD/BRL',
  poupanca: 'Poupança (%)',
};
