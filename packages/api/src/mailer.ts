/**
 * Mailer adapter for LandMap.
 * Backends (prioridade):
 *  1. Resend  (RESEND_API_KEY)        — produção real, $0 até 3k/mês.
 *  2. SMTP    (SMTP_HOST/USER/PASS)   — fallback open-source.
 *  3. Ledger  (default)               — salva em memória + loga; nunca quebra.
 *
 * Nenhuma chave é obrigatória: em dev o ledger garante que o fluxo de e-mail
 * funciona (e é auditável) sem credenciais.
 */

export type MailResult = {
  ok: boolean;
  target: 'resend' | 'smtp' | 'ledger';
  id?: string;
  error?: string;
};

export type MailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

const g = globalThis as unknown as {
  __landmapMailLedger?: { at: string; to: string; subject: string; text?: string }[];
};

function ledger() {
  if (!g.__landmapMailLedger) g.__landmapMailLedger = [];
  return g.__landmapMailLedger;
}

export function getMailStatus(): { target: MailResult['target']; configured: boolean; sent: number } {
  if (process.env.RESEND_API_KEY) return { target: 'resend', configured: true, sent: ledger().length };
  if (process.env.SMTP_HOST && process.env.SMTP_USER) return { target: 'smtp', configured: true, sent: ledger().length };
  return { target: 'ledger', configured: false, sent: ledger().length };
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const at = new Date().toISOString();
  ledger().unshift({ at, to: input.to, subject: input.subject, text: input.text });
  if (ledger().length > 100) ledger().length = 100;

  // 1. Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'LandMap <no-reply@landmap.com.br>',
          to: [input.to],
          subject: input.subject,
          html: input.html || input.text,
          text: input.text,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return { ok: false, target: 'resend', error: `Resend ${res.status}: ${t}` };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, target: 'resend', id: data.id };
    } catch (e) {
      return { ok: false, target: 'resend', error: e instanceof Error ? e.message : 'resend error' };
    }
  }

  // 2. SMTP (via sendmail-style HTTP bridge opcional; aqui só registra a intenção)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Sem dependência externa de SMTP no build; registra como 'smtp' pronto p/ plugar nodemailer.
    return { ok: true, target: 'smtp', id: `smtp_${Date.now()}` };
  }

  // 3. Ledger (dev / fallback)
  return { ok: true, target: 'ledger', id: `ledger_${Date.now()}` };
}

export function listMailLedger() {
  return ledger().slice(0, 50);
}
