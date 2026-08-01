import { NextResponse } from 'next/server';
import { loadMarketProperties } from '../../../../lib/serverData';
import type { Property } from '../../../../lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/market/heatmap?city=X — densidade de preço por bairro.
 * peso = preço médio normalizado (0–1) por bairro. Espelha o backend Hono
 * (@landmap/api) usando a MESMA fonte de dados (properties.json).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get('city') || '').trim();
  const state = (searchParams.get('state') || '').trim().toUpperCase();
  if (!city && !state) return NextResponse.json({ error: 'O parâmetro "city" ou "state" é obrigatório' }, { status: 400 });

  let props: Property[] = loadMarketProperties().filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  if (city) props = props.filter((p) => p.city?.toLowerCase() === city.toLowerCase());
  if (state) props = props.filter((p) => (p.state || '').toUpperCase() === state);

  const agg = new Map<
    string,
    { latSum: number; lngSum: number; coordCount: number; priceSum: number; count: number; city: string; state: string }
  >();
  for (const p of props) {
    const key = p.neighborhood || 'Centro';
    const a = agg.get(key) || { latSum: 0, lngSum: 0, coordCount: 0, priceSum: 0, count: 0, city: p.city || '', state: p.state || '' };
    a.latSum += p.latitude!;
    a.lngSum += p.longitude!;
    a.coordCount += 1;
    a.priceSum += p.price;
    a.count += 1;
    agg.set(key, a);
  }

  const withCoords = Array.from(agg.values());
  const avgPrices = withCoords.map((a) => a.priceSum / a.count);
  const minAvg = avgPrices.length ? Math.min(...avgPrices) : 0;
  const maxAvg = avgPrices.length ? Math.max(...avgPrices) : 0;
  const span = maxAvg - minAvg || 1;

  const points = withCoords.map((a) => {
    const avgPrice = Math.round(a.priceSum / a.count);
    const weight = Number(((avgPrice - minAvg) / span).toFixed(3));
    return {
      lat: Number((a.latSum / a.coordCount).toFixed(5)),
      lng: Number((a.lngSum / a.coordCount).toFixed(5)),
      weight,
      neighborhood: Array.from(agg.keys())[withCoords.indexOf(a)],
      avgPrice,
      city: a.city,
      state: a.state,
    };
  });

  return NextResponse.json(
    { city: city || null, state: state || null, total: points.length, points },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
