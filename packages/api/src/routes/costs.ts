import { Hono } from 'hono';

export interface CostItem {
  category: string;
  description: string;
  amount: number;
  currency: 'USD' | 'BRL';
  monthly: boolean;
  created_at: string;
}

const COSTS: CostItem[] = [
  { category: 'Infrastructure', description: 'iOS Deployment (TestFlight/AppStore)', amount: 100, currency: 'USD', monthly: false, created_at: '2026-08-05' },
  { category: 'Infrastructure', description: '$LAND Token Infrastructure (gas, contract deploy)', amount: 110, currency: 'USD', monthly: false, created_at: '2026-08-05' },
  { category: 'Infrastructure', description: 'VPS/Vercel (hosting, storage)', amount: 345, currency: 'BRL', monthly: true, created_at: '2026-08-05' },
  { category: 'Licenses', description: 'Google Maps/Cloud License', amount: 25, currency: 'USD', monthly: true, created_at: '2026-08-05' },
  { category: 'APIs', description: 'Third-party APIs (Mercado Pago, Stripe, LLM)', amount: 350, currency: 'BRL', monthly: true, created_at: '2026-08-05' },
  { category: 'Team', description: 'Developer time (internal allocation)', amount: 0, currency: 'BRL', monthly: true, created_at: '2026-08-05' },
  { category: 'Legal', description: 'Compliance review (utility token)', amount: 0, currency: 'USD', monthly: false, created_at: '2026-08-05' },
];

export function createCostsRouter() {
  const router = new Hono();

  router.get('/', (c) => {
    const adminToken = c.req.header('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) return c.json({ error: 'unauthorized' }, 401);

    const usdTotal = COSTS.filter(c => c.currency === 'USD').reduce((sum, c) => sum + c.amount, 0);
    const brlTotal = COSTS.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.amount, 0);

    return c.json({
      costs: COSTS,
      monthly_usd: usdTotal,
      monthly_brl: brlTotal,
      note: 'BRL costs estimated at 1 USD = 5.2 BRL for USD comparison'
    });
  });

  router.post('/', async (c) => {
    const adminToken = c.req.header('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) return c.json({ error: 'unauthorized' }, 401);

    const newCost = await c.req.json() as Omit<CostItem, 'created_at'>;
    COSTS.push({ ...newCost, created_at: new Date().toISOString() });

    return c.json({ ok: true, added: newCost });
  });

  return router;
}
