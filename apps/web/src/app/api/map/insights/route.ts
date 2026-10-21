import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { REGIONS, LAYERS, type RegionInsight } from '../../../../lib/landmap-regions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/map/insights — dataset de inteligência territorial do mapa.
 *
 * Lê automaticamente o dataset nacional gerado por `scripts/ingest_terrenos.py`
 * (`public/data/terrenos_brasil.json` — IBGE + OSM + INPE/DEM + Clima) e o
 * mescla (sem duplicar IDs) com o conjunto base `REGIONS`, garantindo 100% de
 * disponibilidade mesmo em ambientes serverless.
 */
function loadIngestedRegions(): RegionInsight[] {
  const candidates = [
    path.join(process.cwd(), 'public', 'data', 'terrenos_brasil.json'),
    path.join(process.cwd(), 'apps', 'web', 'public', 'data', 'terrenos_brasil.json'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw) as { regions?: RegionInsight[] };
        if (Array.isArray(parsed.regions) && parsed.regions.length > 0) {
          return parsed.regions;
        }
      }
    } catch {
      /* fallback para REGIONS */
    }
  }
  return [];
}

export function GET() {
  const ingested = loadIngestedRegions();
  const byId = new Map<string, RegionInsight>();
  for (const r of REGIONS) byId.set(r.id, r);
  for (const r of ingested) byId.set(r.id, r);
  const merged = Array.from(byId.values()).sort((a, b) => b.score - a.score);

  return NextResponse.json(
    {
      regions: merged,
      total: merged.length,
      layers: LAYERS,
      updatedAt: new Date().toISOString(),
      source: ingested.length > 0 ? 'landmap-ingest-ibge-osm-inpe' : 'landmap-core',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
