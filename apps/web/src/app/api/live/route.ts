import { NextRequest, NextResponse } from 'next/server';
import { IbgeClient, SidraClient, BrasilApiClient } from '@landmap/integrations';

/**
 * GET /api/live — aggregates REAL, live, no-key Brazilian open-data into a
 * single "market pulse" feed for the /live page. No simulation.
 *
 * Sources (all public, CORS-free server-side):
 *   - IBGE: estados (27 UFs) → coverage breadth
 *   - SIDRA/IBGE: IPCA geral + Habitação (últimos 13 meses) → inflação real
 *   - BrasilAPI: bancos oficiais → nº de instituições monitoradas
 *
 * If a source is momentarily unreachable it is skipped (not faked) so the
 * feed always reflects what is actually live.
 */
export async function GET(req: NextRequest) {
  const base = new URL(req.url).origin;

  const events: Array<{ id: string; text: string; source: string; ts: string }> = [];
  const generatedAt = new Date().toISOString();

  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  // IBGE — estados (cobertura nacional)
  const ibge = new IbgeClient();
  const ufs = await safe(() => ibge.listUf(), []);
  if (ufs.length) {
    events.push({
      id: `ibge-ufs-${generatedAt}`,
      text: `IBGE: ${ufs.length} unidades federativas monitoradas em tempo real.`,
      source: 'IBGE',
      ts: generatedAt,
    });
  }

  // SIDRA — IPCA
  const sidra = new SidraClient();
  const ipca = await safe(() => sidra.getIpca(13), null);
  if (ipca) {
    const lastG = ipca.geral.points[ipca.geral.points.length - 1];
    const lastH = ipca.habitacao.points[ipca.habitacao.points.length - 1];
    events.push({
      id: `sidra-ipca-${generatedAt}`,
      text: `SIDRA/IBGE: IPCA ${lastG.value.toFixed(2)}% (${lastG.month}) · Habitação ${lastH.value.toFixed(2)}%`,
      source: 'SIDRA',
      ts: generatedAt,
    });
  }

  // BrasilAPI — bancos
  const brasilapi = new BrasilApiClient();
  const banks = await safe(() => brasilapi.listBanks(), []);
  if (banks.length) {
    events.push({
      id: `brasilapi-banks-${generatedAt}`,
      text: `BrasilAPI: ${banks.length} instituições bancárias ativas no país.`,
      source: 'BrasilAPI',
      ts: generatedAt,
    });
  }

  return NextResponse.json({
    live: true,
    base,
    generatedAt,
    stats: {
      sources: events.length,
      ufs: ufs.length,
      banks: banks.length,
      ipcaAvailable: !!ipca,
    },
    events,
  });
}
