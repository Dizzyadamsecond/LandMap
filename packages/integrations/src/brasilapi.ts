/**
 * BrasilAPI — consolidated open-data hub (no API key).
 *
 * This client wraps the endpoints that are reliably live and CORS-free for
 * server-side use:
 *   - /api/ddd/v1/{code}  → state + cities covered by a phone area code
 *   - /api/banks/v1       → official list of Brazilian banks (BCB/ispb)
 *
 * (CNPJ lives in cnpj.ts; FIPE is intentionally excluded because BrasilAPI
 *  returns 403 without an origin/referer, which breaks server-side use.)
 */
import type { BrasilApiConfig, DddInfo, Bank } from './types.js';

const DEFAULT_BASE_URL = 'https://brasilapi.com.br';

export class BrasilApiClient {
  private readonly baseUrl: string;

  constructor(config: BrasilApiConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env.BRASILAPI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  get configured(): boolean {
    return true;
  }

  get mock(): boolean {
    return false;
  }

  async getDdd(code: string | number): Promise<DddInfo> {
    const res = await fetch(`${this.baseUrl}/api/ddd/v1/${code}`);
    if (!res.ok) throw new Error(`BrasilAPI DDD error ${res.status}`);
    const data = (await res.json()) as { state: string; cities: string[] };
    return { state: data.state, cities: data.cities };
  }

  async listBanks(): Promise<Bank[]> {
    const res = await fetch(`${this.baseUrl}/api/banks/v1`);
    if (!res.ok) throw new Error(`BrasilAPI banks error ${res.status}`);
    const data = (await res.json()) as Array<{ ispb: string; name: string; code: number; fullName: string }>;
    return data.map((b) => ({ ispb: b.ispb, name: b.name, code: b.code, fullName: b.fullName }));
  }
}
