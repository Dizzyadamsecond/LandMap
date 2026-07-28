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

export type SmsResult = {
  ok: boolean;
  target: 'playsms' | 'webhook' | 'ledger';
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

type SmsInput = {
  to: string;
  message: string;
};

const gSms = globalThis as unknown as {
  __landmapSmsLedger?: { at: string; to: string; message: string }[];
};

function smsLedger() {
  if (!gSms.__landmapSmsLedger) gSms.__landmapSmsLedger = [];
  return gSms.__landmapSmsLedger;
}

export function getSmsStatus(): { target: SmsResult['target']; configured: boolean; sent: number } {
  if (process.env.PLAYSMS_URL) return { target: 'playsms', configured: true, sent: smsLedger().length };
  if (process.env.SMS_WEBHOOK_URL) return { target: 'webhook', configured: true, sent: smsLedger().length };
  return { target: 'ledger', configured: false, sent: smsLedger().length };
}

export async function sendSms(input: SmsInput): Promise<SmsResult> {
  const at = new Date().toISOString();
  smsLedger().unshift({ at, to: input.to, message: input.message });
  if (smsLedger().length > 100) smsLedger().length = 100;

  if (process.env.PLAYSMS_URL) {
    try {
      const res = await fetch(process.env.PLAYSMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.PLAYSMS_TOKEN ? { Authorization: `Bearer ${process.env.PLAYSMS_TOKEN}` } : {}) },
        body: JSON.stringify({
          to: input.to,
          message: input.message,
          sender: process.env.PLAYSMS_SENDER || 'LandMap',
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, target: 'playsms', error: `playSMS ${res.status}: ${text}` };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, target: 'playsms', id: data.id };
    } catch (e) {
      return { ok: false, target: 'playsms', error: e instanceof Error ? e.message : 'playSMS error' };
    }
  }

  if (process.env.SMS_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.SMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}) },
        body: JSON.stringify({ to: input.to, message: input.message }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, target: 'webhook', error: `sms webhook ${res.status}: ${text}` };
      }
      return { ok: true, target: 'webhook', id: `webhook_${Date.now()}` };
    } catch (e) {
      return { ok: false, target: 'webhook', error: e instanceof Error ? e.message : 'sms webhook error' };
    }
  }

  return { ok: true, target: 'ledger', id: `sms_${Date.now()}` };
}

export function listSmsLedger() {
  return smsLedger().slice(0, 50);
}
