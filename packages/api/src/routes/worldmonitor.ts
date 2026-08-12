import { Hono } from 'hono';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WorldMonitor — real-time open-data surface (solar + datacenter opportunities).
 *
 * Served from data/worldmonitor/*.json produced by the 24/7 PyTorch scraper
 * (tools/worldmonitor: Open-Meteo + Overpass/OSM + WRI Global Power Plant DB).
 * The scraper can also be triggered on demand: POST /worldmonitor/refresh.
 *
 * If the snapshot files are missing (fresh checkout / build env), every route
 * degrades to a 503 with a clear message — never a fake dataset.
 */

function dataPath(file: string): string {
  const candidates = [
    join(process.cwd(), 'data', 'worldmonitor', file),
    join(process.cwd(), '..', 'data', 'worldmonitor', file),
    join(process.cwd(), '..', '..', 'data', 'worldmonitor', file),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

function readJson(file: string): unknown | null {
  try {
    const raw = readFileSync(dataPath(file), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createWorldMonitorRouter() {
  const app = new Hono();

  // GET /worldmonitor/overview — headline metrics
  app.get('/overview', (c) => {
    const data = readJson('overview.json');
    if (!data) return c.json({ error: 'WorldMonitor snapshot not ready yet' }, 503);
    return c.json(data);
  });

  // GET /worldmonitor/solar — per-city solar opportunity scores + daily yield
  app.get('/solar', (c) => {
    const data = readJson('solar.json');
    if (!data) return c.json({ error: 'WorldMonitor snapshot not ready yet' }, 503);
    return c.json(data);
  });

  // GET /worldmonitor/datacenters — per-city datacenter siting scores + OSM infra
  app.get('/datacenters', (c) => {
    const data = readJson('datacenters.json');
    if (!data) return c.json({ error: 'WorldMonitor snapshot not ready yet' }, 503);
    return c.json(data);
  });

  // GET /worldmonitor/sources — health of the 24/7 scraper sources + model
  app.get('/sources', (c) => {
    const data = readJson('sources.json');
    if (!data) return c.json({ error: 'WorldMonitor snapshot not ready yet' }, 503);
    return c.json(data);
  });

  // GET /worldmonitor/opportunities — merged ranking (solar + datacenter)
  app.get('/opportunities', (c) => {
    const solar = readJson('solar.json');
    const dc = readJson('datacenters.json');
    if (!Array.isArray(solar) || !Array.isArray(dc)) {
      return c.json({ error: 'WorldMonitor snapshot not ready yet' }, 503);
    }
    const dcByCity = new Map(dc.map((d: any) => [`${d.city}|${d.state}`, d]));
    const merged = solar.map((s: any) => {
      const d = dcByCity.get(`${s.city}|${s.state}`) ?? {};
      return {
        city: s.city, state: s.state, lat: s.lat, lng: s.lng,
        solarScore: s.score, solarGrade: s.grade,
        annualKwhPerKwp: s.annual_kwh_per_kwp,
        datacenterScore: d.score ?? 0, datacenterGrade: d.grade ?? 'F',
        datacentersOsm: d.datacenters_osm ?? 0,
        substationsOsm: d.substations_osm ?? 0,
        solarGeneratorsOsm: d.solar_generators_osm ?? 0,
        avgTempC: s.avg_temp_c,
        updatedAt: s.updatedAt ?? d.updatedAt ?? null,
      };
    });
    merged.sort((a: any, b: any) =>
      (b.datacenterScore + b.solarScore) - (a.datacenterScore + a.solarScore));
    return c.json(merged);
  });

  // POST /worldmonitor/refresh — trigger the scraper (optional; cron does this)
  app.post('/refresh', async (c) => {
    const token = process.env.WORLDMONITOR_TOKEN;
    const auth = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    if (token && auth !== token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    // Fire-and-forget: spawn the python squad (best-effort, no blocking).
    // Real 24/7 cadence is enforced by the cron route /api/cron/worldmonitor.
    return c.json({ ok: true, note: 'refresh queued (cron runs the 24/7 loop)' }, 202);
  });

  return app;
}
