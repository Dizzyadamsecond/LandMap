import { NextResponse } from 'next/server';
import { REGIONS, LAYERS } from '../../../../lib/landmap-regions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/map/insights — dataset de inteligência territorial do mapa.
 *
 * Mesmo contrato de dados que a Lovable LIVE entrega ao dashboard
 * (`RegionInsight[]` de `lib/landmap-regions`): score, camadas, histórico de
 * preço, timeline e destaques por região. O cliente (dashboard/mapa) busca
 * aqui ao montar e cai para o dataset estático embutido se a API falhar —
 * a UI nunca fica vazia.
 *
 * Substituir o mock por fontes reais (IBGE, prefeituras, APIs geoespaciais)
 * acontece só neste módulo, sem tocar na UI — é exatamente o ponto de
 * integração previsto pelo comentário de cabeçalho de `landmap-regions.ts`.
 */
export function GET() {
  return NextResponse.json(
    {
      regions: REGIONS,
      layers: LAYERS,
      updatedAt: new Date().toISOString(),
      source: 'landmap-core',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
