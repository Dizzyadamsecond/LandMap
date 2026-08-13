import { sendPushToAll, getPushStatus } from '@landmap/api/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Teste de push: dispara uma notificação para todos os inscritos.
 * Body opcional: { title?, body?, url?, tag? }
 */
export async function POST(request: Request) {
  try {
    const status = getPushStatus();
    if (status.subscribers === 0) {
      return Response.json(
        { ok: false, error: 'Nenhum inscrito ainda. Abra o app, aceite notificações e recarregue.' },
        { status: 400 },
      );
    }
    let body: { title?: string; body?: string; url?: string; tag?: string } = {};
    try {
      body = await request.json();
    } catch {
      /* usa defaults */
    }
    const res = await sendPushToAll({
      title: body.title || 'LandMap — teste de push 🚀',
      body: body.body || 'Notificação em tempo real funcionando! Casas e apartamentos ao vivo.',
      url: body.url || '/pt-BR',
      tag: body.tag || 'landmap-test',
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : 'erro ao enviar' },
      { status: 500 },
    );
  }
}
