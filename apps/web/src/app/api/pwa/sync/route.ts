import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/pwa/sync — recebe ações reenviadas pelo background sync do SW.
 * Persiste em um log local (data/offline-actions.jsonl) para rastreabilidade;
 * em produção o comportamento pode ser ampliado (ex.: reaplicar favorito).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = {
      receivedAt: new Date().toISOString(),
      ...body,
    };
    // Append-only log no filesystem (funciona em Vercel com runtime nodejs)
    try {
      const { appendFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      await appendFile(join(process.cwd(), 'data', 'offline-actions.jsonl'), JSON.stringify(record) + '\n', 'utf8');
    } catch {
      /* sem filesystem persistente (serverless) — responde ok mesmo assim */
    }
    return NextResponse.json({ ok: true, receivedAt: record.receivedAt });
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'landmap-sync' });
}
