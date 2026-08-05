import { Hono } from 'hono';
import { z } from 'zod';
export const BRAZIL_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
export const NORTHEAST_STATES = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'];
const auctionSchema = z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    sourceUrl: z.string().url().optional(),
    title: z.string().min(1),
    city: z.string().min(1),
    state: z.enum(BRAZIL_STATES),
    type: z.enum(['terreno', 'casa', 'apartamento', 'comercial', 'rural', 'outro']).default('outro'),
    auctionDate: z.string().datetime().optional(),
    price: z.number().nonnegative().optional(),
    areaM2: z.number().positive().optional(),
    latitude: z.number().min(-35).max(6).optional(),
    longitude: z.number().min(-75).max(-30).optional(),
    status: z.enum(['open', 'scheduled', 'closed', 'unknown']).default('unknown'),
    updatedAt: z.string().datetime().optional(),
});
const ingestSchema = z.object({
    items: z.array(auctionSchema).min(1).max(500),
});
const store = new Map();
const listeners = new Set();
function hasValidIngestToken(c) {
    const expected = c.env?.AUCTION_INGEST_TOKEN ?? process.env.AUCTION_INGEST_TOKEN;
    if (!expected)
        return true;
    return c.req.header('authorization') === `Bearer ${expected}`;
}
export function subscribeAuctionStream(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
export function getAuctionSnapshot(state, limit = 100, region) {
    const normalizedState = state?.trim().toUpperCase();
    return [...store.values()]
        .filter((item) => !normalizedState || item.state === normalizedState)
        .filter((item) => region?.toUpperCase() !== 'NE' || NORTHEAST_STATES.includes(item.state))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, Math.min(Math.max(limit, 1), 500));
}
function upsert(item) {
    const normalized = {
        ...item,
        updatedAt: item.updatedAt ?? new Date().toISOString(),
    };
    store.set(normalized.id, normalized);
    for (const listener of listeners)
        listener(normalized);
    return normalized;
}
export const auctionsApp = new Hono();
auctionsApp.get('/', (c) => {
    const state = c.req.query('state');
    const region = c.req.query('region');
    if (state && !BRAZIL_STATES.includes(state.toUpperCase())) {
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
    if (!hasValidIngestToken(c))
        return c.json({ error: 'Não autorizado' }, 401);
    let body;
    try {
        body = await c.req.json();
    }
    catch {
        return c.json({ error: 'Body JSON inválido' }, 400);
    }
    const parsed = ingestSchema.safeParse(body);
    if (!parsed.success)
        return c.json({ error: 'Lote de leilões inválido', issues: parsed.error.issues }, 400);
    const items = parsed.data.items.map(upsert);
    return c.json({ ok: true, accepted: items.length, items });
});
export default auctionsApp;
