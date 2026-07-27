/**
 * Compliance — regras anti-ban e anti-lgpd em TEMPO REAL.
 *
 * Princípios (não-negociáveis, definidos com o dono):
 *  - SÓ envia para lead com OPT-IN explícito (consentimento registrado).
 *  - Respeita OPT-OUT (pedido de parar → bloqueia canal pra sempre).
 *  - Só em HORÁRIO COMERCIAL (08:00–20:00, seg–sáb) do fuso do lead.
 *  - Cadência mínima entre toques (decidida por conversion.decideFollowUp).
 *  - NUNCA rotação de números/proxy para evadir ban — limite natural acima.
 */

export type ConsentStatus = 'none' | 'opt_in' | 'opt_out';

export interface ContactCompliance {
  leadId: string;
  consent: Record<'whatsapp' | 'call' | 'sms', ConsentStatus>;
  /** Último envio por canal (ISO) — p/ respeitar cadência mínima. */
  lastSentAt?: Partial<Record<'whatsapp' | 'call' | 'sms', string>>;
  timezone?: string; // ex.: 'America/Sao_Paulo'
}

const BUSINESS_START_H = 8;
const BUSINESS_END_H = 20;

export function hasConsent(c: ContactCompliance, channel: keyof ContactCompliance['consent']): boolean {
  return c.consent[channel] === 'opt_in';
}

export function isOptedOut(c: ContactCompliance, channel: keyof ContactCompliance['consent']): boolean {
  return c.consent[channel] === 'opt_out';
}

/** Horário comercial no fuso do lead (fallback: Brasília). */
export function inBusinessHours(now = new Date(), tz = 'America/Sao_Paulo'): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      weekday: 'short',
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '12');
    const dow = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
    if (dow === 'Sun') return false;
    return hour >= BUSINESS_START_H && hour < BUSINESS_END_H;
  } catch {
    return true; // se não conseguir resolver o tz, libera (operador decide)
  }
}

/**
 * Verifica se pode enviar AGORA considerando consentimento + opt-out +
 * horário comercial + cadência mínima (em horas) por canal.
 */
export function canContact(
  c: ContactCompliance,
  channel: keyof ContactCompliance['consent'],
  minCadenceHours: number,
  now = new Date(),
): { ok: boolean; reason: string } {
  if (isOptedOut(c, channel)) return { ok: false, reason: 'opt_out' };
  if (!hasConsent(c, channel)) return { ok: false, reason: 'no_consent' };
  if (!inBusinessHours(now, c.timezone)) return { ok: false, reason: 'off_hours' };
  const last = c.lastSentAt?.[channel];
  if (last) {
    const elapsedH = (now.getTime() - new Date(last).getTime()) / 3_600_000;
    if (elapsedH < minCadenceHours) {
      return { ok: false, reason: `cadence_${Math.ceil(minCadenceHours - elapsedH)}h` };
    }
  }
  return { ok: true, reason: 'clear' };
}
