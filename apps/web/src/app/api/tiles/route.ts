import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Proxy de tiles do mapa — elimina a dependência de CDN de tiles externo no
 * cliente. O Vercel busca os tiles server-side (onde a rede alcança os CDNs)
 * e os entrega pelo nosso próprio domínio (landmapwebprod2.vercel.app), que já é
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

const gt = (lyrs: string) => (z: number, x: number, y: number) =>
  `https://mt${(x + y) % 4}.google.com/vt/lyrs=${lyrs}&hl=pt-BR&gl=BR&x=${x}&y=${y}&z=${z}`;

const PROVIDERS: Record<string, Provider> = {
  green: { name: 'Google Terrain', build: gt('p') },
  light: { name: 'Google Roadmap', build: gt('m') },
  satellite: { name: 'Google Hybrid', build: gt('y') },
  satlabels: { name: 'Google Labels', build: gt('h') },
  // Cinza escuro (canvas neutro).
  arcgis: {
    name: 'Esri Dark Gray Canvas',
    build: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`,
  },
  // Claro (canvas neutro).
  lightgray: {
    name: 'Esri Light Gray Canvas',
    build: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${z}/${y}/${x}`,
  },
  // Aliases legados (carto/osm) redirecionam para equivalentes Esri sem chave,
  // para não quebrar links antigos; não batem mais em CDN que exige chave.
  carto: {
    name: 'Esri Dark Gray Canvas',
    build: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`,
  },
  osm: {
    name: 'Esri World Topographic',
    build: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
  },
};

// Ordem de failover (todos Esri = sem chave). Verde primeiro.
const ORDER = ['green', 'light', 'lightgray', 'satellite', 'arcgis'] as const;

function num(v: string | null, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

/**
 * Detecta tile de watermark/erro (ex.: "API KEY REQUIRED" do CARTO): PNG
 * pequeno com paleta de pouquíssimas cores. Tiles de mapa reais têm muitas
 * cores; um placeholder tem ~2KB e <= 8 cores na paleta PLTE.
 */
function isWatermarkTile(buf: ArrayBuffer, contentType: string): boolean {
  if (!contentType.includes('png')) return false;
  if (buf.byteLength > 2500) return false;
  const bytes = new Uint8Array(buf);
  let colors = Infinity;
  for (let i = 8; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4c && bytes[i + 2] === 0x54 && bytes[i + 3] === 0x45) {
      colors = (bytes[i + 4] << 8) | bytes[i + 5];
      break;
    }
  }
  return colors !== Infinity && colors <= 8;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const srcParam = (searchParams.get('src') || 'green').toLowerCase();
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
          // UA PURO de browser (sem token de bot): o OSM serve o tile clássico
          // (verde/amarelo) só para user-agents de browser; qualquer token de
          // bot no UA faz o CDN devolver um tile de estilo antigo (bege).
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          accept: 'image/png,image/*',
        },
        // timeout curto: se um provider falhar, cai no próximo
        signal: AbortSignal.timeout(8000),
      });
      if (!upstream.ok) continue;
      const buf = await upstream.arrayBuffer();
      if (!buf.byteLength) continue;
      const contentType = upstream.headers.get('content-type') || 'image/png';
      // Descarta tiles de watermark/erro (ex.: "API KEY REQUIRED") e tenta o
      // próximo provedor em vez de entregar um tile inútil ao mapa.
      if (isWatermarkTile(buf, contentType)) continue;
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
