import { sendMail, getMailStatus, listMailLedger } from '@landmap/api/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      to?: string;
      subject?: string;
      html?: string;
      text?: string;
    };
    if (!body.to || !body.subject) {
      return Response.json({ ok: false, error: 'to + subject obrigatórios' }, { status: 400 });
    }
    const result = await sendMail({
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
    });
    return Response.json({ ok: result.ok, result, mailStatus: getMailStatus() });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : 'invalid body' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return Response.json({ ok: true, status: getMailStatus(), ledger: listMailLedger() });
}
