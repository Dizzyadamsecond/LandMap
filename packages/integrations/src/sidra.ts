/**
 * SIDRA — Sistema IBGE de Recuperação Automática (IBGE national statistics).
 *
 * Public, no API key. Covers real-estate-relevant series:
 *   - IPCA (table 1736) and the housing sub-item (variável 2266 = "Habitação")
 *   - INCC (table 1302), IGPM (table 1303) when available
 *   - General price indices per month for the whole country
 *
 * This is the canonical "live macro" backbone for LandMap: national inflation
 * and construction-cost indices feed valuation, ROI and cash-flow engines.
 */
import type { SidraConfig, SidraSeries, SidraPoint } from './types.js';

const DEFAULT_BASE_URL = 'https://apisidra.ibge.gov.br/values';

export class SidraClient {
  private readonly baseUrl: string;

  constructor(config: SidraConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env.SIDRA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  get configured(): boolean {
    return true;
  }

  get mock(): boolean {
    return false;
  }

  /**
   * Fetch one SIDRA table/variable as monthly time-series.
   * @param table e.g. 1736 (IPCA)
   * @param variable e.g. 2266 (Habitação) — optional, defaults to all
   * @param territory default '1' (Brasil)
   * @param lastN keep only the most recent N months
   */
  async getSeries(opts: {
    table: number;
    variable?: number;
    territory?: string;
    lastN?: number;
  }): Promise<SidraSeries> {
    const territory = opts.territory ?? '1';
    const varPart = opts.variable ? `/v/${opts.variable}` : '';
    const url = `${this.baseUrl}/t/${opts.table}/n1/${territory}${varPart}/f/n`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SIDRA error ${res.status}`);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows) || rows.length === 0) {
      return { table: opts.table, variable: opts.variable, points: [] };
    }
    // First row is the header map; subsequent rows are data points.
    const header = rows[0] as Record<string, string>;
    const monthKey = header.D2N ?? 'Mês';
    const valueKey = header.V ?? 'Valor';
    const points: SidraPoint[] = rows
      .slice(1)
      .map((row) => {
        const month = String(row[monthKey] ?? '').trim();
        const raw = String(row[valueKey] ?? '').replace(',', '.').trim();
        const value = Number.parseFloat(raw);
        return { month, value: Number.isFinite(value) ? value : NaN };
      })
      .filter((p) => Number.isFinite(p.value));
    const out = points
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(opts.lastN ? -opts.lastN : undefined);
    return { table: opts.table, variable: opts.variable, points: out };
  }

  /** Latest national IPCA month-over-month and the Habitação sub-item. */
  async getIpca(lastN = 13): Promise<{ geral: SidraSeries; habitacao: SidraSeries }> {
    const [geral, habitacao] = await Promise.all([
      this.getSeries({ table: 1736, territory: '1', lastN }),
      this.getSeries({ table: 1736, variable: 2266, territory: '1', lastN }),
    ]);
    return { geral, habitacao };
  }
}
