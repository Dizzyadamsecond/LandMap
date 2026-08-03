import { Hono } from 'hono';
import { z } from 'zod';
import { emitWebhook } from '../webhooks/store.js';

/**
 * Inbound B2B ingestion — empresas (imobiliárias, leiloeiros, construtoras)
 * enviam leads/terrenos para o LandMap via API autenticada. Cada registro
 * vira um evento `lead.created` / `property.created` re-emitido para os
 * webhooks OUTBOUND dos clientes da própria empresa (padrão já existente).
 *
 * Auth: header `X-LandMap-ApiKey: <token>` cujo token deve estar em
 * LANDMAP_INGEST_TOKENS (comma-separated) no env. Sem token válido => 401.
 * Isso NÃO quebra UX nem rotas existentes — é um novo router isolado.
 */

type PropertyRecord = {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  areaM2: number;
  bedrooms?: number;
  type: 'apartamento' | 'casa' | 'terreno' | 'comercial';
  modality: 'venda' | 'aluguel' | 'lancamento';
  available: boolean;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  zone?: string;
  street?: string;
  status: 'active' | 'sold' | 'rented' | 'reserved';
  createdAt: string;
  updatedAt: string;
  images: string[];
  tags: string[];
};

const INGEST_TOKENS_ENV = (process.env.LANDMAP_INGEST_TOKENS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function authOk(c: { req: { header: (k: string) => string | undefined } }): boolean {
  if (INGEST_TOKENS_ENV.length === 0) return false; // auth desligado se não configurado
  const token = c.req.header('X-LandMap-ApiKey') ?? c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  return INGEST_TOKENS_ENV.includes(token);
}

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  interest: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

const propertySchema = z.object({
  title: z.string().min(1),
  city: z.string(),
  state: z.string(),
  price: z.number().nonnegative(),
  areaM2: z.number().nonnegative(),
  type: z.enum(['apartamento', 'casa', 'terreno', 'comercial']).default('terreno'),
  modality: z.enum(['venda', 'aluguel', 'lancamento']).default('venda'),
  neighborhood: z.string().optional(),
  zone: z.string().optional(),
  street: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  meta: z.record(z.unknown()).optional(),
});

export function createIngestRouter(getNextId: () => string) {
  const router = new Hono();
  const ingestedLeads: Array<z.infer<typeof leadSchema> & { id: string; createdAt: string }> = [];
  const ingestedProperties: PropertyRecord[] = [];

  router.use('*', async (c, next) => {
    if (!authOk(c)) {
      return c.json({ ok: false, error: 'Não autorizado: informe X-LandMap-ApiKey válido' }, 401);
    }
    await next();
  });

  router.get('/health', (c) => c.json({ ok: true, service: 'ingest', leads: ingestedLeads.length, properties: ingestedProperties.length }));

  router.post('/leads', async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: 'JSON inválido' }, 400);
    }
    const parsed = leadSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Lead inválido', issues: parsed.error.issues }, 400);
    }
    const lead = { ...parsed.data, id: `ld_${getNextId()}`, createdAt: new Date().toISOString() };
    ingestedLeads.unshift(lead);
    await emitWebhook('lead.created', lead);
    return c.json({ ok: true, lead }, 201);
  });

  router.post('/properties', async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: 'JSON inválido' }, 400);
    }
    const parsed = propertySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Propriedade inválida', issues: parsed.error.issues }, 400);
    }
    const now = new Date().toISOString();
    const property = {
      id: `pr_${getNextId()}`,
      ...parsed.data,
      available: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      bedrooms: undefined,
    } as unknown as PropertyRecord;
    ingestedProperties.unshift(property);
    await emitWebhook('property.created', property);
    return c.json({ ok: true, property }, 201);
  });

  router.get('/leads', (c) => c.json({ ok: true, items: ingestedLeads, total: ingestedLeads.length }));
  router.get('/properties', (c) => c.json({ ok: true, items: ingestedProperties, total: ingestedProperties.length }));

  return router;
}
