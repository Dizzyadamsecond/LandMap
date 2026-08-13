import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Proxy de tiles do mapa — elimina a dependência de CDN de tiles externo no
 * cliente. O Vercel busca os tiles server-side (onde a rede alcança os CDNs)
 * e os entrega pelo nosso próprio domínio (landmapprod.vercel.app), que já é
 * permitido pelo CSP (img-src 'self'). Failover: CARTO Dark Matter → OSM →
 * ArcGIS World Dark Gray. Isso resolve o "mapa em branco" quando a rede do
 * usuário bloqueia/throtta os CDNs de tiles diretos.
 *
 * Uso: /api/tiles?src=carto|osm|arcgis&z=12&x=1609&y=2090&r=2 (r opcional = @2x)
 */

type Provider = {
  name: string;
  build: (z: number, x: number, y: number, r: string) => string;
};

const PROVIDERS: Record<string, Provider> = {
  carto: {
    name: 'CARTO Dark Matter',
    build: (z, x, y, r) =>
      `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${r ? `@${r}x` : ''}.png`,
  },
  osm: {
    name: 'OpenStreetMap',
    build: (z, x, y) =>
      `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
  arcgis: {
    name: 'ArcGIS World Dark Gray',
    build: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`,
  },
};

const ORDER = ['carto', 'osm', 'arcgis'] as const;

function num(v: string | null, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const srcParam = (searchParams.get('src') || 'carto').toLowerCase();
  const r = searchParams.get('r') || '';
  const z = num(searchParams.get('z'), 12);
  const x = num(searchParams.get('x'), 1609);
  const y = num(searchParams.get('y'), 2090);

  // Clamp de segurança contra abuso
  if (z < 0 || z > 19 || x < 0 || y < 0) {
    return new Response('Bad zoom/coord', { status: 400 });
  }

  const order =
    srcParam in PROVIDERS ? [srcParam as (typeof ORDER)[number], ...ORDER.filter((s) => s !== srcParam)] : ORDER;

  for (const key of order) {
    const provider = PROVIDERS[key];
    const url = provider.build(z, x, y, r);
    try {
      const upstream = await fetch(url, {
        headers: {
          'user-agent': 'LandMapTileProxy/1.0 (https://landmap.com.br)',
          accept: 'image/png,image/*',
        },
        // timeout curto: se um provider falhar, cai no próximo
        signal: AbortSignal.timeout(8000),
      });
      if (!upstream.ok) continue;
      const buf = await upstream.arrayBuffer();
      if (!buf.byteLength) continue;
      const contentType = upstream.headers.get('content-type') || 'image/png';
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Tile-Provider': provider.name,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      // próximo provider
    }
  }

  // Fallback visual: PNG transparente 1x1 para não quebrar o Leaflet
  const TRANSPARENT_PNG =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const bin = Buffer.from(TRANSPARENT_PNG, 'base64');
  return new Response(bin, {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'X-Tile-Provider': 'none' },
  });
}
