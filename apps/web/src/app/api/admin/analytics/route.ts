import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PlausibleResponse = {
  results?: Array<{ dimensions?: string[]; metrics?: number[] }>;
  meta?: Record<string, unknown>;
};

async function plausibleQuery(query: Record<string, unknown>): Promise<PlausibleResponse | null> {
  const token = process.env.PLAUSIBLE_STATS_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID || process.env.PLAUSIBLE_DOMAIN;
  if (!token || !siteId) return null;

  const res = await fetch('https://plausible.io/api/v2/query', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ site_id: siteId, ...query }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Plausible API ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as PlausibleResponse;
}

async function fetchSelf(path: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}`;
  const res = await fetch(`${origin}${path}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  const [summary, topPages, referrers, entryPages, funnel] = await Promise.all([
    plausibleQuery({ metrics: ['visitors', 'pageviews', 'bounce_rate', 'visit_duration'], date_range: '30d' }),
    plausibleQuery({
      metrics: ['visitors', 'pageviews', 'bounce_rate'],
      date_range: '30d',
      dimensions: ['event:page'],
      order_by: [['pageviews', 'desc']],
      pagination: { limit: 8, offset: 0 },
    }),
    plausibleQuery({
      metrics: ['visitors'],
      date_range: '30d',
      dimensions: ['visit:source'],
      order_by: [['visitors', 'desc']],
      pagination: { limit: 8, offset: 0 },
    }),
    plausibleQuery({
      metrics: ['visitors'],
      date_range: '30d',
      dimensions: ['visit:entry_page'],
      order_by: [['visitors', 'desc']],
      pagination: { limit: 8, offset: 0 },
    }),
    fetchSelf('/api/funnel/report?days=30'),
  ]);

  return NextResponse.json({
    configured: Boolean(process.env.PLAUSIBLE_STATS_API_KEY && (process.env.PLAUSIBLE_SITE_ID || process.env.PLAUSIBLE_DOMAIN)),
    summary,
    topPages,
    referrers,
    entryPages,
    funnel,
  });
}
