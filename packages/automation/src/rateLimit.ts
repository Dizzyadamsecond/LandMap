/**
 * Rate limiter — proteção anti-ban em TEMPO REAL.
 *
 * Não usamos proxies de evasão: usamos LIMITAÇÃO NATURAL. Cada canal tem
 * um token-bucket que impede rajadas (a causa #1 de ban em WA/telefonia).
 * Respeita ainda janela de horário comercial (compliance.ts).
 */
export interface BucketState {
  tokens: number;
  lastRefill: number; // epoch ms
}

export class TokenBucket {
  private state: BucketState;
  constructor(
    private capacity: number,
    private refillPerSec: number,
    private start = Date.now(),
  ) {
    this.state = { tokens: capacity, lastRefill: start };
  }

  /** Tenta consumir 1 token. Retorna false se sem capacidade (→ esperar). */
  tryConsume(now = Date.now()): boolean {
    this.refill(now);
    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      return true;
    }
    return false;
  }

  private refill(now: number): void {
    const dt = (now - this.state.lastRefill) / 1000;
    this.state.tokens = Math.min(this.capacity, this.state.tokens + dt * this.refillPerSec);
    this.state.lastRefill = now;
  }

  /** Segundos até o próximo token (0 se disponível). */
  secondsToNext(now = Date.now()): number {
    this.refill(now);
    if (this.state.tokens >= 1) return 0;
    const need = 1 - this.state.tokens;
    return Math.ceil(need / this.refillPerSec);
  }
}

/**
 * Limites conservadores por canal (anti-ban). Ajustáveis por env.
 * Baixos de propósito: melhor poucos envios reais do que conta banida.
 */
export interface ChannelLimits {
  whatsapp: { perMin: number; perDay: number };
  call: { perMin: number; perDay: number };
  sms: { perMin: number; perDay: number };
}

export const DEFAULT_LIMITS: ChannelLimits = {
  whatsapp: { perMin: 2, perDay: 200 }, // ~1 a cada 30s, teto diário baixo
  call: { perMin: 1, perDay: 80 },
  sms: { perMin: 1, perDay: 150 },
};

export class RateGate {
  private minuteBuckets: Record<string, TokenBucket>;
  private dayCounters: Record<string, { count: number; day: string }> = {};

  constructor(private limits: ChannelLimits = DEFAULT_LIMITS) {
    const mk = (perMin: number) => new TokenBucket(perMin, perMin / 60);
    this.minuteBuckets = {
      whatsapp: mk(limits.whatsapp.perMin),
      call: mk(limits.call.perMin),
      sms: mk(limits.sms.perMin),
    };
  }

  /** Pode enviar AGORA? (minuto + teto diário). */
  canSend(channel: keyof ChannelLimits, now = Date.now()): { ok: boolean; retryInSec: number } {
    const dayKey = new Date(now).toISOString().slice(0, 10);
    const dc = (this.dayCounters[channel] ??= { count: 0, day: dayKey });
    if (dc.day !== dayKey) {
      dc.count = 0;
      dc.day = dayKey;
    }
    const cap = this.limits[channel].perDay;
    if (dc.count >= cap) return { ok: false, retryInSec: 86400 };
    if (!this.minuteBuckets[channel].tryConsume(now)) {
      return { ok: false, retryInSec: this.minuteBuckets[channel].secondsToNext(now) };
    }
    dc.count += 1;
    return { ok: true, retryInSec: 0 };
  }
}
