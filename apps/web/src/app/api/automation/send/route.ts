import { z } from 'zod';
import { sendMail, sendSms, getMailStatus, getSmsStatus, listMailLedger, listSmsLedger } from '@landmap/api/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  channel: z.enum(['email', 'sms']).default('email'),
  to: z.string().min(1),
  subject: z.string().optional(),
  message: z.string().min(1),
  html: z.string().optional(),
});

export async function GET() {
  return Response.json({
    ok: true,
    mail: { status: getMailStatus(), ledger: listMailLedger() },
    sms: { status: getSmsStatus(), ledger: listSmsLedger() },
  });
}

export async function POST(request: Request) {
  try {
    const payload = bodySchema.parse(await request.json());
    if (payload.channel === 'email') {
      if (!payload.subject) {
        return Response.json({ ok: false, error: 'subject obrigatório para email' }, { status: 400 });
      }
      const result = await sendMail({
        to: payload.to,
        subject: payload.subject,
        text: payload.message,
        html: payload.html,
      });
      return Response.json({ ok: result.ok, channel: 'email', result, status: getMailStatus() });
    }

    const result = await sendSms({
      to: payload.to,
      message: payload.message,
    });
    return Response.json({ ok: result.ok, channel: 'sms', result, status: getSmsStatus() });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'invalid body' },
      { status: 400 },
    );
  }
}
