import { NextRequest, NextResponse } from 'next/server';
import { getBrApi } from '../../../../lib/brApis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Proxy server-side para as 40 APIs públicas do Brasil.
// Evita CORS no browser e impede vazamento de tokens/keys (nunca chegam ao client).
export async function GET(
  req: NextRequest,
  { params }: { params: { slug?: string[] } },
) {
  const id = params.slug?.[0];
  if (!id) {
    return NextResponse.json({ error: 'Informe o id da API. Ex.: /api/br/ibge-estados' }, { status: 400 });
  }

  const api = getBrApi(id);
  if (!api) {
    return NextResponse.json(
      { error: `API "${id}" não encontrada no catálogo de 40 APIs BR.`, available: true },
      { status: 404 },
    );
  }

  // Timeout curto para não travar a resposta.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(api.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LandMap/1.0 (+https://landmap.com.br)',
        Accept: 'application/json, text/plain, */*',
        ...(api.headers || {}),
      },
      cache: 'no-store',
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    // Tenta devolver JSON quando possível; senão devolve texto.
    const isJson = contentType.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[');
    if (isJson) {
      try {
        return NextResponse.json({
          ok: res.ok,
          status: res.status,
          api: api.name,
          data: JSON.parse(text),
        });
      } catch {
        // JSON inválido: devolve texto cru
        return NextResponse.json({ ok: res.ok, status: res.status, api: api.name, text });
      }
    }
    return new NextResponse(text, {
      status: res.ok ? 200 : 502,
      headers: { 'content-type': contentType || 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return NextResponse.json(
      { ok: false, status: 502, api: api.name, error: msg },
      { status: 502 },
    );
  }
}
