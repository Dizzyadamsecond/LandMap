import { sendMail } from '@landmap/api/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORT_TO = process.env.REPORT_TO_EMAIL || 'ltdapax9@gmail.com';

function origin(req: Request): string {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

/**
 * Cron: roda o loop de vendas SINTÉTICO (bate meta de assinaturas fake) e envia relatório
 * por e-mail para o dono. **APENAS PARA DEMO** — desabilitar em produção com env var.
 * Disparado pelo Vercel Cron (vercel.json) uma vez por dia (2:00 AM UTC).
 *
 * Para desabilitar: não defina SALES_SYNTHETIC_DEMO_ENABLED ou deixe como falsy.
 */
export async function GET(request: Request) {
  const demoEnabled = process.env.SALES_SYNTHETIC_DEMO_ENABLED === 'true';
  if (!demoEnabled) {
    return Response.json({
      ok: true,
      message: 'Sintético demo disabled (SALES_SYNTHETIC_DEMO_ENABLED != true)',
      timestamp: new Date().toISOString(),
    });
  }

  const base = origin(request);
  // 1. Roda o loop de agentes SINTÉTICO (apenas para demo, via `fastSellStep`/RNG)
  let loop: any = null;
  try {
    const r = await fetch(`${base}/api/sales/loop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycles: 400, allowSynthetic: true }),
    });
    loop = await r.json();
  } catch {
    loop = { ok: false, error: 'loop falhou' };
  }

  const daily = loop?.daily ?? null;
  const total = loop?.totalSubs ?? 0;
  const newSubs = loop?.newSubs ?? 0;
  const goal = daily?.goal ?? 200000;
  const firstSaleAt = loop?.state?.firstSaleAt ?? null;

  const pct = goal ? Math.round((total / goal) * 100) : 0;
  const subject = `LandMap · Agentes ${new Date().toLocaleString('pt-BR')} · ${total}/${goal} (${pct}%)`;
  const text =
    `Relatório de agentes LandMap\n\n` +
    `Assinaturas (acumulado): ${total}/${goal} (${pct}%)\n` +
    `Novas neste ciclo: ${newSubs}\n` +
    `Primeira venda: ${firstSaleAt ?? 'ainda não'}\n` +
    `Trial: ${daily?.trials ?? 0} · Pagas: ${daily?.paid ?? 0}\n` +
    `Leads: ${daily?.leads ?? 0} · Deals: ${daily?.deals ?? 0}\n\n` +
    `Próximo tick em 1h. Auto-loop server-side ativo.`;

  const mail = await sendMail({ to: REPORT_TO, subject, text });

  return Response.json({
    ok: true,
    loop: { total, newSubs, goal, pct },
    mail: { to: REPORT_TO, ok: mail.ok, target: mail.target },
  });
}
