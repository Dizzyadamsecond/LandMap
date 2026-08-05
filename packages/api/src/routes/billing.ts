import { Hono } from 'hono';
import { createGateway, resolveGateway, PLAN_CONFIG, type PlanTier } from '@landmap/billing';

export function createBillingRouter() {
  const router = new Hono();

  router.post('/checkout', async (c) => {
    const { tier, interval, method } = await c.req.json().catch(() => ({})) as any;
    if (!tier || !['monthly', 'yearly'].includes(interval)) return c.json({ error: 'invalid' }, 400);
    if (!Object.keys(PLAN_CONFIG).includes(tier)) return c.json({ error: 'unknown tier' }, 400);

    const userId = c.req.header('x-user-id') || `user_${Date.now()}`;
    const gatewayId = resolveGateway(method, 'BR');
    const gateway = createGateway(gatewayId);

    const result = await gateway.createCheckoutSession({
      userId,
      tier: tier as PlanTier,
      interval: interval as any,
      method,
      successUrl: `${c.req.url.split('/api')[0]}/checkout?success=true`,
      cancelUrl: `${c.req.url.split('/api')[0]}/checkout?canceled=true`,
    });

    return c.json(result);
  });

  router.get('/subscription', (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);
    return c.json({ id: `sub_${userId}`, user_id: userId, tier: 'free', status: 'active' });
  });

  router.post('/subscription/cancel', (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);
    return c.json({ ok: true });
  });

  router.get('/payments/:id', (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);
    return c.json({ id: c.req.param('id'), status: 'pending', gateway: 'mercadopago' });
  });

  router.get('/keys', (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);
    return c.json([{ id: 'ak_1', key_prefix: 'lm_live_...', tier: 'pro' }]);
  });

  router.post('/keys', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);
    const key = `lm_live_${Math.random().toString(36).slice(2, 20)}`;
    return c.json({ key, id: `ak_${Date.now()}`, key_prefix: 'lm_live_...' });
  });

  router.get('/keys/:id/usage', (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);
    return c.json({ today_requests: 42, quota_daily: 100000, quota_remaining: 99958 });
  });

  return router;
}
