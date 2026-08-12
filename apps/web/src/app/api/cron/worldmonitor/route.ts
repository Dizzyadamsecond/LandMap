import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron — heartbeat + staleness guard for the WorldMonitor snapshot.
 * The heavy 24/7 scraping loop runs locally (Hermes cron, tools/worldmonitor);
 * this route lets the platform confirm the data is fresh and surface a summary.
 *
 * Schedule: every 30 minutes in vercel.json.
 */
export async function GET(request: Request) {
  const base = new URL(request.url).origin;

  // Upward walk (serverless cwd varies per lambda) — same pattern as loadJson.
  const candidates: string[] = [];
  const starts = [process.cwd(), typeof __dirname !== 'undefined' ? __dirname : ''];
  for (const start of starts) {
    if (!start) continue;
    let dir = start;
    for (let i = 0; i < 6; i++) {
      candidates.push(join(dir, 'data', 'worldmonitor', 'overview.json'));
      candidates.push(join(dir, '..', 'data', 'worldmonitor', 'overview.json'));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  let overview: any = null;
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        overview = JSON.parse(readFileSync(p, 'utf-8'));
        break;
      } catch {
        overview = null;
      }
    }
  }

  const freshness = overview
    ? Math.round((Date.now() - new Date(overview.generatedAt).getTime()) / 60000)
    : null;

  const apiOk = await fetch(`${base}/api/worldmonitor/overview`, { cache: 'no-store' })
    .then((r) => r.status === 200)
    .catch(() => false);

  return Response.json({
    ok: true,
    apiOk,
    snapshot: overview ? {
      generatedAt: overview.generatedAt,
      cities: overview.cities,
      records: overview.records,
      freshnessMinutes: freshness,
      stale: freshness !== null && freshness > 180,
    } : null,
    note: overview
      ? 'WorldMonitor snapshot fresh. Local 24/7 scraper keeps this updated.'
      : 'Snapshot missing on this runtime — local scraper writes data/worldmonitor/*.',
    timestamp: new Date().toISOString(),
  });
}
