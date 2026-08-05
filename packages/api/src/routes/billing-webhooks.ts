import { Hono } from 'hono';
import { MercadoPagoGateway, StripeGateway } from '@landmap/billing';

export function createBillingWebhooksRouter() {
  const router = new Hono();

  router.post('/mercadopago', async (c) => {
    const rawBody = await c.req.text();
    const headers = Object.fromEntries(c.req.raw.headers);

    const token = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
    const gateway = new MercadoPagoGateway(process.env.MERCADOPAGO_ACCESS_TOKEN || '', token);

    if (!gateway.verifyWebhookSignature(rawBody, headers)) {
      return c.json({ error: 'invalid signature' }, 401);
    }

    const event = gateway.parseWebhookEvent(rawBody, headers);
    if (!event) return c.json({ ok: true });

    // TODO: update DB subscriptions/payments based on event
    console.log('[webhook/mercadopago]', event.type, event.paymentId);

    return c.json({ ok: true });
  });

  router.post('/stripe', async (c) => {
    const rawBody = await c.req.text();
    const headers = Object.fromEntries(c.req.raw.headers);

    const token = process.env.STRIPE_WEBHOOK_SECRET || '';
    const gateway = new StripeGateway(process.env.STRIPE_SECRET_KEY || '', token);

    if (!gateway.verifyWebhookSignature(rawBody, headers)) {
      return c.json({ error: 'invalid signature' }, 401);
    }

    const event = gateway.parseWebhookEvent(rawBody, headers);
    if (!event) return c.json({ ok: true });

    console.log('[webhook/stripe]', event.type, event.paymentId);

    return c.json({ ok: true });
  });

  return router;
}
