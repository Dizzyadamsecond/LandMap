import { NextResponse } from 'next/server';
import { loadMarketProperties } from '../../../../lib/serverData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type NeighborhoodAgg = {
  name: string;
  city: string;
  state: string;
  count: number;
  avgPricePerSqm: number;
  minPricePerSqm: number;
  maxPricePerSqm: number;
  avgPrice: number;
  lat: number;
  lng: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get('city') || '').trim();
  const state = (searchParams.get('state') || '').trim().toUpperCase();
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const ids = (searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);

  let props = loadMarketProperties().filter((p) => p.latitude != null && p.longitude != null && p.areaM2 > 0);

  if (ids.length) {
    const setIds = new Set(ids.map((s) => s.toLowerCase()));
    props = props.filter((p) => setIds.has(`${p.city}|${p.state}|${p.neighborhood || 'Centro'}`.toLowerCase()));
  } else {
    if (city) props = props.filter((p) => (p.city || '').toLowerCase() === city.toLowerCase());
    if (state) props = props.filter((p) => (p.state || '').toUpperCase() === state);
    if (q) props = props.filter((p) => (p.neighborhood || '').toLowerCase().includes(q));
  }

  const map = new Map<string, NeighborhoodAgg>();
  for (const p of props) {
    if (p.latitude == null || p.longitude == null) continue;
    const name = p.neighborhood?.trim() || 'Centro';
    const key = `${p.city}|${p.state}|${name}`;
    const ppm2 = p.price / p.areaM2;
    const cur = map.get(key) || {
      name,
      city: p.city || '',
      state: p.state || '',
      count: 0,
      avgPricePerSqm: 0,
      minPricePerSqm: Number.POSITIVE_INFINITY,
      maxPricePerSqm: 0,
      avgPrice: 0,
      lat: 0,
      lng: 0,
    };
    cur.count += 1;
    cur.avgPricePerSqm += ppm2;
    cur.minPricePerSqm = Math.min(cur.minPricePerSqm, ppm2);
    cur.maxPricePerSqm = Math.max(cur.maxPricePerSqm, ppm2);
    cur.avgPrice += p.price;
    cur.lat += p.latitude;
    cur.lng += p.longitude;
    map.set(key, cur);
  }

  const items: NeighborhoodAgg[] = Array.from(map.values())
    .map((cur) => ({
      ...cur,
      avgPricePerSqm: Number((cur.avgPricePerSqm / cur.count).toFixed(2)),
      minPricePerSqm: Number(cur.minPricePerSqm.toFixed(2)),
      maxPricePerSqm: Number(cur.maxPricePerSqm.toFixed(2)),
      avgPrice: Number(Math.round(cur.avgPrice / cur.count)),
      lat: Number((cur.lat / cur.count).toFixed(5)),
      lng: Number((cur.lng / cur.count).toFixed(5)),
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(
    { city: city || null, state: state || null, total: items.length, items },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
