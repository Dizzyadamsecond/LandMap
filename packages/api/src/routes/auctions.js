import { Hono } from 'hono';

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
export const NORTHEAST_STATES = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'];

const auctionSchema = {
  parse(input) {
    return input;
  },
};
const store = new Map();
const listeners = new Set();

function hasValidIngestToken(c) {
  const expected = c.env?.AUCTION_INGEST_TOKEN ?? process.env.AUCTION_INGEST_TOKEN;
  if (!expected) return true;
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
  const normalized = { ...item, updatedAt: item.updatedAt ?? new Date().toISOString() };
  store.set(normalized.id, normalized);
  for (const listener of listeners) listener(normalized);
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
  if (!hasValidIngestToken(c)) return c.json({ error: 'Não autorizado' }, 401);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Body JSON inválido' }, 400);
  }
  if (!body || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 500) {
    return c.json({ error: 'Lote de leilões inválido' }, 400);
  }
  const invalid = body.items.find((item) =>
    !item?.id || !item?.source || !item?.title || !item?.city || !BRAZIL_STATES.includes(String(item.state).toUpperCase()),
  );
  if (invalid) return c.json({ error: 'Cada oportunidade deve conter id, source, title, city e UF válida' }, 400);
  const items = body.items.map((item) => upsert({ ...item, state: item.state.toUpperCase() }));
  return c.json({ ok: true, accepted: items.length, items });
});

export default auctionsApp;
