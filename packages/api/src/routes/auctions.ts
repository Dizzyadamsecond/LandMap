import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../index.js';
import { loadAuctions } from '../loadJson.js';

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;
export const NORTHEAST_STATES = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] as const;

export type AuctionCategory = 'terreno' | 'casa' | 'apartamento' | 'comercial' | 'rural' | 'outro';
export type AuctionType = 'judicial' | 'extrajudicial' | 'bank' | 'public';
export type AuctionLotStatus = 'open' | 'scheduled' | 'closed' | 'unknown';
export type AuctionGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * A single auction lot (imóvel em leilão). Covers casas, apartamentos,
 * terrenos e comerciais, de leilão judicial, extrajudicial ou de banco.
 * `discountPct` (desconto do lance vs. avaliação de mercado) and `grade`
 * (oportunidade LandMap A–F) make it directly comparable to residential data.
 */
export type AuctionOpportunity = {
  id: string;
  source: string;
  sourceUrl?: string;
  title: string;
  description?: string;
  city: string;
  state: (typeof BRAZIL_STATES)[number];
  neighborhood?: string;
  street?: string;
  category: AuctionCategory;
  auctionType: AuctionType;
  type: AuctionCategory;
  auctionDate?: string;
  price?: number;
  marketPrice?: number;
  discountPct?: number;
  areaM2?: number;
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parkingSpaces?: number;
  floor?: number;
  latitude?: number;
  longitude?: number;
  status: AuctionLotStatus;
  matricula?: string;
  editalUrl?: string;
  origemDivida?: string;
  grade?: AuctionGrade;
  score?: number;
  risks?: string[];
  drivers?: string[];
  tags?: string[];
  updatedAt: string;
};

const auctionSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  city: z.string().min(1),
  state: z.enum(BRAZIL_STATES),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  category: z.enum(['terreno', 'casa', 'apartamento', 'comercial', 'rural', 'outro']).default('outro'),
  auctionType: z.enum(['judicial', 'extrajudicial', 'bank', 'public']).default('bank'),
  type: z.enum(['terreno', 'casa', 'apartamento', 'comercial', 'rural', 'outro']).optional(),
  auctionDate: z.string().datetime().optional().or(z.string().min(1).optional()),
  price: z.number().nonnegative().optional(),
  marketPrice: z.number().nonnegative().optional(),
  discountPct: z.number().min(-100).max(100).optional(),
  areaM2: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  suites: z.number().int().nonnegative().optional(),
  parkingSpaces: z.number().int().nonnegative().optional(),
  floor: z.number().int().optional(),
  latitude: z.number().min(-35).max(6).optional(),
  longitude: z.number().min(-75).max(-30).optional(),
  status: z.enum(['open', 'scheduled', 'closed', 'unknown']).default('unknown'),
  matricula: z.string().optional(),
  editalUrl: z.string().url().optional(),
  origemDivida: z.string().optional(),
  grade: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).optional(),
  score: z.number().min(0).max(100).optional(),
  risks: z.array(z.string()).optional(),
  drivers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  updatedAt: z.string().datetime().optional().or(z.string().min(1).optional()),
});

const ingestSchema = z.object({
  items: z.array(auctionSchema).min(1).max(500),
});

const store = new Map<string, AuctionOpportunity>();
const listeners = new Set<(item: AuctionOpportunity) => void>();

function hasValidIngestToken(c: { req: { header(name: string): string | undefined }; env: Env['Bindings'] }) {
  const expected = c.env?.AUCTION_INGEST_TOKEN ?? process.env.AUCTION_INGEST_TOKEN;
  if (!expected) return true;
  return c.req.header('authorization') === `Bearer ${expected}`;
}

export function subscribeAuctionStream(listener: (item: AuctionOpportunity) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toOpportunity(raw: z.infer<typeof auctionSchema>): AuctionOpportunity {
  const type = raw.type ?? raw.category;
  return {
    ...raw,
    type,
    status: raw.status ?? 'unknown',
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  } as AuctionOpportunity;
}

export function getAuctionSnapshot(state?: string, limit = 100, region?: string) {
  const normalizedState = state?.trim().toUpperCase();
  return [...store.values()]
    .filter((item) => !normalizedState || item.state === normalizedState)
    .filter((item) => region?.toUpperCase() !== 'NE' || NORTHEAST_STATES.includes(item.state as (typeof NORTHEAST_STATES)[number]))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, Math.min(Math.max(limit, 1), 500));
}

function upsert(raw: z.infer<typeof auctionSchema>): AuctionOpportunity {
  const normalized = toOpportunity(raw);
  store.set(normalized.id, normalized);
  listeners.forEach((listener) => listener(normalized));
  return normalized;
}

/**
 * Seed the in-memory store from `data/auctions.json` (real Brazilian auction
 * lots). Runs once at module load so `GET /auctions`, the `/ws/auctions`
 * snapshot and the `/map` layer never serve an empty set even before any
 * `/ingest` call. Never throws — an unreadable dataset degrades to warnings.
 */
function seedFromDataset() {
  let rows: unknown[] = [];
  try {
    // loadAuctions may be bundled into a sibling chunk after tsup/esbuild.
    rows = loadAuctions();
  } catch {
    rows = [];
  }
  if (!Array.isArray(rows) || rows.length === 0) return;
  let accepted = 0;
  rows.forEach((row) => {
    const parsed = auctionSchema.safeParse(row);
    if (!parsed.success) return;
    upsert(parsed.data);
    accepted++;
  });
  if (accepted) console.log(`[auctions] seeded ${accepted} lotes de leilão de data/auctions.json`);
}

// Populate the in-memory store once at module load so GET /auctions, the
// /ws/auctions snapshot and the /map layer serve real data without a prior
// /ingest call. Runs after the store + listeners are defined above.
seedFromDataset();

export const auctionsApp = new Hono<Env>();

auctionsApp.get('/', (c) => {
  const state = c.req.query('state');
  const region = c.req.query('region');
  if (state && !BRAZIL_STATES.includes(state.toUpperCase() as (typeof BRAZIL_STATES)[number])) {
    return c.json({ error: 'state deve ser uma UF brasileira válida' }, 400);
  }
  if (region && region.toUpperCase() !== 'NE') {
    return c.json({ error: 'region aceita apenas NE neste momento' }, 400);
  }
  const limit = Number(c.req.query('limit') ?? '100');
  return c.json({
    region: region?.toUpperCase() ?? 'BR',
    state: state?.toUpperCase() ?? null,
    items: getAuctionSnapshot(state, Number.isFinite(limit) ? limit : 100, region),
    generatedAt: new Date().toISOString(),
  });
});

auctionsApp.post('/ingest', async (c) => {
  if (!hasValidIngestToken(c)) return c.json({ error: 'Não autorizado' }, 401);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Body JSON inválido' }, 400);
  }
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Lote de leilões inválido', issues: parsed.error.issues }, 400);
  const items = parsed.data.items.map(upsert);
  return c.json({ ok: true, accepted: items.length, items });
});

export default auctionsApp;
