import { savePushSubscription, getPushStatus } from '@landmap/api/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!body.endpoint) {
      return Response.json({ ok: false, error: 'endpoint obrigatório' }, { status: 400 });
    }
    const count = savePushSubscription({
      endpoint: body.endpoint,
      keys: body.keys,
      createdAt: new Date().toISOString(),
    });
    return Response.json({ ok: true, subscribers: count, status: getPushStatus() });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : 'invalid body' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return Response.json({ ok: true, status: getPushStatus() });
}
