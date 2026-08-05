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

    if (event.type === 'payment.approved' && event.paymentId) {
      console.log('[webhook/mercadopago] Payment approved:', event.paymentId);
      // TODO: 1. Update payments table: SET status = 'confirmed' WHERE gateway_payment_id = event.paymentId
      // TODO: 2. Create settlement: INSERT INTO settlements (transaction_id, recipient_id, amount_cents, status) VALUES (...)
      // TODO: 3. Emit event to sales/agente: transaction.confirmed
    } else if (event.type === 'payment.rejected') {
      console.log('[webhook/mercadopago] Payment rejected:', event.paymentId);
      // TODO: Update payments table: SET status = 'rejected' WHERE gateway_payment_id = event.paymentId
    }

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

    if (event.type === 'payment.approved' && event.paymentId) {
      console.log('[webhook/stripe] Payment succeeded:', event.paymentId);
      // TODO: 1. Update payments table: SET status = 'confirmed' WHERE gateway_payment_id = event.paymentId
      // TODO: 2. Create settlement: INSERT INTO settlements (transaction_id, recipient_id, amount_cents, status) VALUES (...)
      // TODO: 3. Emit event to sales/agent: transaction.confirmed
    } else if (event.type === 'payment.rejected') {
      console.log('[webhook/stripe] Payment failed:', event.paymentId);
      // TODO: Update payments table: SET status = 'rejected' WHERE gateway_payment_id = event.paymentId
    }

    return c.json({ ok: true });
  });

  return router;
}
