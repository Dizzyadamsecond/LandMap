import { Hono } from 'hono';
import type { Env } from './index.js';
import { loadProperties } from './loadJson.js';

export type Neighborhood = {
  name: string;
  city: string;
  state: string;
  schools: number;
  hospitals: number;
  transit: string[];
  crimeIndex: number; // 0 (muito baixo) a 100 (muito alto)
  avgPriceM2: number;
};

function buildAllNeighborhoods(): Neighborhood[] {
  const rows = loadProperties() as any[];
  const map = new Map<string, Neighborhood>();
  for (const p of rows) {
    const city = (p.city || '').trim();
    const state = (p.state || '').trim().toUpperCase();
    const name = (p.neighborhood || 'Centro').trim();
    const key = `${city}|${state}|${name}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name,
        city,
        state,
        schools: 0,
        hospitals: 0,
        transit: [],
        crimeIndex: 0,
        avgPriceM2: 0,
      });
    }
    const cur = map.get(key)!;
    cur.schools += 1;
    cur.hospitals += 1;
    if (Array.isArray(p.tags)) cur.transit.push(...p.tags);
    cur.crimeIndex = Math.round((cur.crimeIndex + (p.risks?.length ? 20 : 5)));
    const ppm2 = typeof p.pricePerM2 === 'number' ? p.pricePerM2 : p.areaM2 > 0 ? p.price / p.areaM2 : 0;
    cur.avgPriceM2 = cur.avgPriceM2 === 0 ? Math.round(ppm2) : Math.round((cur.avgPriceM2 + ppm2) / 2);
  }
  return Array.from(map.values()).map((x) => ({
    ...x,
    transit: x.transit.slice(0, 6),
    crimeIndex: Math.max(0, Math.min(100, x.crimeIndex)),
  }));
}

const allNeighborhoods = buildAllNeighborhoods();

export function createNeighborhoodsRouter() {
  const router = new Hono<Env>();

  /** GET /neighborhoods?city=X */
  router.get('/', async (c) => {
    const city = c.req.query('city');
    if (!city) {
      return c.json({ error: 'Query parameter "city" is required' }, 400);
    }

    const filtered = allNeighborhoods.filter(
      (n) => n.city.toLowerCase() === city.toLowerCase()
    );

    return c.json({ items: filtered, total: filtered.length });
  });

  /** GET /neighborhoods/all — retorna todos os bairros */
  router.get('/all', async (c) => {
    return c.json({ items: allNeighborhoods, total: allNeighborhoods.length });
  });

  /** GET /neighborhoods?ids=city|state|name,city|state|name — retorna bairros por ids compostos */
  router.get('/by-ids', async (c) => {
    const raw = c.req.query('ids');
    if (!raw) {
      return c.json({ items: [], total: 0 });
    }

    const keys = new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((token) => {
          const trimmed = token.toLowerCase();
          if (trimmed.includes(',')) return trimmed;
          return `${trimmed}|brasil`;
        })
    );

    const filtered = allNeighborhoods.filter((n) => {
      const key = `${n.city.toLowerCase()}|${n.state.toLowerCase()}|${n.name.toLowerCase()}`;
      return keys.has(key);
    });

    return c.json({ items: filtered, total: filtered.length });
  });

  return router;
}
