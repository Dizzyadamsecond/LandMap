import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * OSM2Buildings fallback for the 3D World viewer.
 *
 * When Overpass is unavailable, this endpoint provides pre-rendered building
 * footprints from the OSM2Buildings open-source project. It's slower than
 * Overpass but provides global coverage with decent quality.
 */

type BBox = [number, number, number, number]; // [west, south, east, north]

interface OSM2BBuilding {
  id: string;
  geometry: number[][][];
  height?: number;
}

interface OSM2BResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Polygon'; coordinates: number[][][] };
    properties: { height?: number };
  }>;
}

/**
 * Attempt to fetch pre-rendered buildings from OSM2Buildings.
 * Works at tile-level; slower but reliable.
 */
async function fetchOSM2Buildings(bbox: BBox): Promise<any> {
  const [w, s, e, n] = bbox;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    // OSM2Buildings provides data at /data/v3/{z}/{x}/{y}.json
    // We'll construct tile coordinates from the bbox
    const baseZoom = 14;

    // Convert bbox to tile coordinates
    function latLng2tile(lat: number, lng: number, z: number): [number, number] {
      const n = Math.pow(2, z);
      const x = ((lng + 180) / 360) * n;
      const y = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
      return [Math.floor(x), Math.floor(y)];
    }

    const [minTileX, minTileY] = latLng2tile(s, w, baseZoom);
    const [maxTileX, maxTileY] = latLng2tile(n, e, baseZoom);

    const features: any[] = [];

    // Fetch tiles (max 9 tiles per request to avoid hammering the service)
    for (let x = minTileX; x <= maxTileX && x - minTileX < 3; x++) {
      for (let y = minTileY; y <= maxTileY && y - minTileY < 3; y++) {
        try {
          const tileUrl = `https://tiles.openstreetmap.de/data/v3/${baseZoom}/${x}/${y}.json`;
          const res = await fetch(tileUrl, {
            signal: controller.signal,
            headers: { 'user-agent': 'LandMap/1.0 (+https://landmapv1.vercel.app)' },
          });

          if (!res.ok) continue;

          const json = (await res.json()) as OSM2BResponse;
          if (json.features) {
            features.push(
              ...json.features.map((f: any) => ({
                ...f,
                properties: { height: f.properties?.height || 8 },
              }))
            );
          }
        } catch {
          // continue to next tile
        }
      }
    }

    if (features.length > 0) {
      return {
        type: 'FeatureCollection',
        features,
      };
    }
  } catch {
    // fallthrough
  } finally {
    clearTimeout(timer);
  }

  return null;
}

export async function POST(request: Request) {
  let bbox: unknown;
  try {
    ({ bbox } = (await request.json()) as { bbox?: unknown });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  function isValidBBox(v: unknown): v is BBox {
    if (!Array.isArray(v) || v.length !== 4) return false;
    const [w, s, e, n] = v;
    return (
      [w, s, e, n].every((x) => typeof x === 'number' && Number.isFinite(x)) &&
      w >= -180 && e <= 180 && s >= -90 && n <= 90 && e > w && n > s &&
      e - w < 1 && n - s < 1
    );
  }

  if (!isValidBBox(bbox)) {
    return NextResponse.json(
      { error: 'A valid bbox [west, south, east, north] (< 1° span) is required.' },
      { status: 400 },
    );
  }

  const data = await fetchOSM2Buildings(bbox);
  if (data) {
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  }

  return NextResponse.json(
    { error: 'OSM2Buildings data unavailable for this area.', type: 'FeatureCollection', features: [] },
    { status: 206 }, // Partial content — fallback will be used
  );
}
