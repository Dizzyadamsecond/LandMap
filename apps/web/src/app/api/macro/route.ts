import { NextRequest, NextResponse } from 'next/server';

// Macro indicators — live from public Brazilian open data ($0, no API key):
//   IPCA  -> Banco Central do Brasil SGS série 433 (variação mensal %)
//   Selic -> BCB SGS série 11 (taxa básica % a.a.)
//   CDI   -> BCB SGS série 4389 (% a.a.)
//   USD   -> awesomeapi last/USD-BRL (cotação + variação)
// Server-side to avoid browser CORS and to cache briefly.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Serie = { data: string; valor: string }[];

async function bcb(serie: string): Promise<{ value: number; date: string } | null> {
  try {
    const res = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/1?formato=json`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Serie;
    if (!data?.length) return null;
    return { value: parseFloat(data[0].valor.replace(',', '.')), date: data[0].data };
  } catch {
    return null;
  }
}

async function usd(): Promise<{ value: number; varPct: number; date: string } | null> {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const q = data?.USDBRL;
    if (!q) return null;
    return {
      value: parseFloat(q.bid),
      varPct: parseFloat(q.pctChange),
      date: q.create_date,
    };
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const [ipca, selic, cdi, dolar] = await Promise.all([bcb('433'), bcb('11'), bcb('4389'), usd()]);

  // Fallback values (most recent known) so the UI never shows a hard error.
  const indicators = {
    ipca: ipca ?? { value: 0.16, date: '01/06/2026' },
    selic: selic ?? { value: 5.166, date: '07/08/2026' },
    cdi: cdi ?? { value: 13.9, date: '06/08/2026' },
    usd: dolar ?? { value: 5.08, varPct: 0, date: new Date().toISOString() },
  };

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      live: !!(ipca && selic && cdi && dolar),
      indicators,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
