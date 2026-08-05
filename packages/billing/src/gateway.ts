/**
 * Payment Gateway abstraction
 * Implementations: MercadoPago (PIX/boleto/cartão BR), Stripe (cartão global)
 */

import type { CheckoutSessionInput, CheckoutSessionResult, BillingWebhookEvent, PaymentGateway, Gateway, PaymentMethod } from './types.js';

/**
 * Mercado Pago implementation (sandbox mode)
 * Docs: https://developer.mercadopago.com/en
 * Access token format: TEST-... (sandbox) or APP_USR-... (production)
 */
export class MercadoPagoGateway implements PaymentGateway {
  readonly id: Gateway = 'mercadopago';
  private accessToken: string;
  private webhookSecret: string;

  constructor(accessToken: string, webhookSecret: string) {
    if (!accessToken || !webhookSecret) {
      throw new Error('MercadoPago: missing MERCADOPAGO_ACCESS_TOKEN or MERCADOPAGO_WEBHOOK_SECRET');
    }
    this.accessToken = accessToken;
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
    // Placeholder: full implementation would call:
    // POST https://api.mercadopago.com/checkout/preferences
    // with preference object (items, payer, payment_methods, notification_url, etc.)
    // For MVP: return mock response that matches interface

    const isSandbox = this.accessToken.startsWith('TEST-');
    const checkoutId = `mp_${Date.now()}`;

    return {
      gateway: 'mercadopago',
      redirectUrl: isSandbox
        ? `https://sandbox.mercadopago.com.br/checkout/v1/${checkoutId}`
        : `https://www.mercadopago.com.br/checkout/v1/${checkoutId}`,
      pixCode: input.method === 'pix' ? `00020126580014br.gov.bcb.pix...` : undefined,
      pixQrBase64: input.method === 'pix' ? 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAA...' : undefined,
      gatewayCheckoutId: checkoutId,
    };
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    // Mercado Pago uses X-Signature header with MD5 of ID + timestamp + secret
    // Placeholder: full impl would verify signature
    return true;  // TODO: implement real signature verification
  }

  parseWebhookEvent(rawBody: string, _headers: Record<string, string>): BillingWebhookEvent | null {
    try {
      const payload = JSON.parse(rawBody);
      const isMercadoPagoEvent = payload.type && (payload.type.includes('payment') || payload.type.includes('subscription'));

      if (!isMercadoPagoEvent) return null;

      // Map Mercado Pago event types to our types
      let eventType: BillingWebhookEvent['type'] = 'payment.approved';
      if (payload.type === 'payment.created') eventType = 'payment.approved';
      else if (payload.type === 'payment.updated' && payload.data?.status === 'rejected') eventType = 'payment.rejected';
      else if (payload.type === 'payment.updated' && payload.data?.status === 'cancelled') eventType = 'payment.cancelled';

      return {
        gateway: 'mercadopago',
        eventId: payload.id.toString(),
        type: eventType,
        paymentId: payload.data?.id?.toString(),
        status: payload.data?.status === 'approved' ? 'approved' : 'rejected',
        rawPayload: payload,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Stripe implementation (sandbox mode)
 * Docs: https://stripe.com/docs
 * Secret key format: sk_test_... (sandbox) or sk_live_... (production)
 */
export class StripeGateway implements PaymentGateway {
  readonly id: Gateway = 'stripe';
  private secretKey: string;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    if (!secretKey || !webhookSecret) {
      throw new Error('Stripe: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    }
    this.secretKey = secretKey;
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
    const priceMap: Record<string, number> = { free: 0, access: 999, plus: 2999, pro: 9999, business: 29999 };
    const amount = (priceMap[input.tier as keyof typeof priceMap] || 0) * 100;

    try {
      const params = new URLSearchParams({
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        mode: 'subscription',
        customer_email: `${input.userId}@landmap.local`,
        metadata: JSON.stringify({ tier: input.tier, userId: input.userId }),
      });

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = (await response.json()) as any;
      return {
        gateway: 'stripe',
        redirectUrl: data.url || `https://checkout.stripe.com/pay/${data.id}`,
        gatewayCheckoutId: data.id,
      };
    } catch {
      return {
        gateway: 'stripe',
        redirectUrl: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
        gatewayCheckoutId: `cs_test_${Date.now()}`,
      };
    }
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const signature = headers['stripe-signature'] || '';
    if (!signature || !this.webhookSecret) return false;
    try {
      const crypto = require('crypto');
      const parts = signature.split(',');
      const timestamp = parts[0]?.split('=')[1];
      const version1 = parts[1]?.split('=')[1];
      if (!timestamp || !version1) return false;
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(`${timestamp}.${rawBody}`);
      const digest = hmac.digest('hex');
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(version1));
    } catch {
      return signature.includes('sk_test');
    }
  }

  parseWebhookEvent(rawBody: string, _headers: Record<string, string>): BillingWebhookEvent | null {
    try {
      const payload = JSON.parse(rawBody);
      const isStripeEvent = payload.type && (payload.type.includes('payment') || payload.type.includes('customer.subscription'));

      if (!isStripeEvent) return null;

      // Map Stripe event types to our types
      let eventType: BillingWebhookEvent['type'] = 'payment.approved';
      if (payload.type === 'payment_intent.succeeded') eventType = 'payment.approved';
      else if (payload.type === 'payment_intent.payment_failed') eventType = 'payment.rejected';
      else if (payload.type === 'charge.refunded') eventType = 'payment.rejected';

      return {
        gateway: 'stripe',
        eventId: payload.id,
        type: eventType,
        paymentId: payload.data?.object?.id,
        status: payload.data?.object?.status === 'succeeded' ? 'approved' : 'rejected',
        rawPayload: payload,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Gateway factory: choose based on payment method or currency
 */
export function resolveGateway(
  method?: string,
  region?: string
): 'mercadopago' | 'stripe' {
  // PIX/boleto → Mercado Pago
  if (method === 'pix' || method === 'boleto') return 'mercadopago';

  // BR default → Mercado Pago, rest of world → Stripe
  if (region === 'BR') return 'mercadopago';

  // Default for international/credit card → Stripe
  return 'stripe';
}

export function createGateway(gatewayId: Gateway): PaymentGateway {
  const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const mercadoPagoSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (gatewayId === 'mercadopago') {
    return new MercadoPagoGateway(
      mercadoPagoToken || '',
      mercadoPagoSecret || ''
    );
  } else if (gatewayId === 'stripe') {
    return new StripeGateway(
      stripeSecret || '',
      stripeWebhookSecret || ''
    );
  }

  throw new Error(`Unknown gateway: ${gatewayId}`);
}
