/**
 * Dispatcher — orquestra o envio multi-canal orientado pela PROBABILIDADE
 * de conversão (packages/sales/conversion) e pelas regras anti-ban.
 *
 * Fluxo por lead:
 *   1. conversion.decideFollowUp(prob, perfil) → veredito + esforço
 *   2. compliance.canContact → consentimento/opt-out/horário/cadência
 *   3. rateLimit.canSend → limite natural por minuto/dia
 *   4. sender.enviar (mock por padrão; real só com AUTOMATION_LIVE=1)
 */
import { RateGate } from './rateLimit.js';
import { canContact, type ContactCompliance } from './compliance.js';
import { decideFollowUp, type FollowUpVerdict } from '@landmap/sales';
import type { UserProfile } from '@landmap/sales';

export type Channel = 'whatsapp' | 'call' | 'sms';

export interface DispatchInput {
  leadId: string;
  /** Probabilidade de conversão 0–1. */
  probability: number;
  profile: UserProfile;
  /** Consentimento + opt-out + horário do lead. */
  compliance: ContactCompliance;
  followUpsSent: number;
  draft: { whatsapp?: string; callScript?: string; sms?: string };
}

export interface DispatchResult {
  channel: Channel | null;
  sent: boolean;
  verdict: FollowUpVerdict;
  reason: string;
  retryInSec: number;
}

export interface Sender {
  readonly channel: Channel;
  send(leadId: string, message: string): Promise<{ id: string; mock: boolean }>;
}

/** Sender mock: NUNCA dispara rede; só registra (modo default AUTOMATION_LIVE=0). */
export class MockSender implements Sender {
  constructor(public channel: Channel, private live: boolean) {}
  async send(leadId: string, message: string) {
    return { id: `mock-${this.channel}-${leadId}-${Date.now()}`, mock: !this.live };
  }
}

export class Dispatcher {
  private gate = new RateGate();
  private live: boolean;
  private senders: Record<Channel, Sender>;

  constructor(opts?: { live?: boolean; senders?: Partial<Record<Channel, Sender>> }) {
    this.live = opts?.live ?? process.env.AUTOMATION_LIVE === '1';
    this.senders = {
      whatsapp: opts?.senders?.whatsapp ?? new MockSender('whatsapp', this.live),
      call: opts?.senders?.call ?? new MockSender('call', this.live),
      sms: opts?.senders?.sms ?? new MockSender('sms', this.live),
    };
  }

  async dispatch(input: DispatchInput): Promise<DispatchResult> {
    const decision = decideFollowUp(input.probability, input.profile, input.followUpsSent);

    // Pause → não tenta nem canal
    if (decision.verdict === 'pause') {
      return { channel: null, sent: false, verdict: decision.verdict, reason: decision.reason, retryInSec: decision.nextDelayHours * 3600 };
    }

    // Ordem de preferência por propensão (alta → chamada+WA; baixa → só WA leve)
    const order: Channel[] =
      decision.verdict === 'aggressive'
        ? ['call', 'whatsapp', 'sms']
        : decision.verdict === 'normal'
          ? ['whatsapp', 'sms']
          : ['whatsapp'];

    for (const ch of order) {
    const draft = ch === 'call' ? input.draft.callScript : input.draft[ch];
    if (!draft) continue;

      const comp = canContact(input.compliance, ch, decision.nextDelayHours / 24 || 1);
      if (!comp.ok) continue; // tenta próximo canal

      const rate = this.gate.canSend(ch);
      if (!rate.ok) continue;

      const res = await this.senders[ch].send(input.leadId, draft);
      return {
        channel: ch,
        sent: true,
        verdict: decision.verdict,
        reason: `sent_${ch}_${res.mock ? 'mock' : 'live'}`,
        retryInSec: 0,
      };
    }

    return {
      channel: null,
      sent: false,
      verdict: decision.verdict,
      reason: 'blocked_consent_or_rate',
      retryInSec: decision.nextDelayHours * 3600,
    };
  }
}
