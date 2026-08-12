import { platformFetch } from '@landmap/api/platform';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET/POST /api/worldmonitor/* -> Hono platform router (createWorldMonitorRouter).
 * Serves real-time solar + datacenter opportunity snapshots produced by the
 * 24/7 PyTorch scraper (tools/worldmonitor).
 */
export async function GET(request: Request) {
  return platformFetch(request);
}

export async function POST(request: Request) {
  return platformFetch(request);
}
