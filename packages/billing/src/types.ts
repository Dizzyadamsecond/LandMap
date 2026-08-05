/**
 * LandMap Billing Types
 * Adapted from docs/war-room/00-billing-types.ts
 */

export type PlanTier = 'free' | 'access' | 'plus' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'charged_back' | 'expired';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';
export type Gateway = 'mercadopago' | 'stripe';
export type CashbackKind = 'buyer' | 'seller' | 'referral';
export type CashbackStatus = 'pending' | 'confirmed' | 'released' | 'reversed';
export type BillingInterval = 'monthly' | 'yearly';

// Hono/Fetch types for gateways
export interface CheckoutSessionInput {
  userId: string;
  tier: PlanTier;
  interval: BillingInterval;
  method?: PaymentMethod;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  gateway: Gateway;
  redirectUrl?: string;  // Stripe/MercadoPago redirect
  pixCode?: string;      // Mercado Pago PIX direct
  pixQrBase64?: string;  // QR code base64
  gatewayCheckoutId: string;
}

export interface BillingWebhookEvent {
  gateway: Gateway;
  eventId: string;
  type: 'payment.approved' | 'payment.rejected' | 'payment.cancelled' | 'subscription.created' | 'subscription.updated' | 'subscription.canceled';
  subscriptionId?: string;
  paymentId?: string;
  status?: PaymentStatus;
  rawPayload: Record<string, any>;
}

export interface PaymentGateway {
  readonly id: Gateway;
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean;
  parseWebhookEvent(rawBody: string, headers: Record<string, string>): BillingWebhookEvent | null;
}

// Database types (matching migrations/0003_billing.sql)
export interface Subscription {
  id: string;
  user_id: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  gateway?: Gateway;
  gateway_customer_id?: string;
  gateway_subscription_id?: string;
  current_period_end?: string;  // ISO
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  gateway: Gateway;
  gateway_payment_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  raw_payload?: Record<string, any>;
  created_at: string;
}

export interface CashbackTxn {
  id: string;
  user_id: string;
  kind: CashbackKind;
  amount_cents: number;
  status: CashbackStatus;
  deal_value_cents?: number;
  released_at?: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  tier: PlanTier;
  revoked_at?: string;
  created_at: string;
  last_used_at?: string;
}

// Plan configuration (matching apps/web/src/lib/plans.ts tiers)
export interface Plan {
  tier: PlanTier;
  name: string;
  priceBRLMonthly: number;
  priceBRLYearly: number;
  cashbackRate: number;  // % sobre fechamento
  limits: PlanLimits;
  features: PlanFeatures;
}

export interface PlanLimits {
  searchesPerDay: number;      // -1 = unlimited
  aiMessagesPerDay: number;
  savedComparisons: number;
  agentCyclesPerDay: number;
}

export interface PlanFeatures {
  heatmap: boolean;
  unlimitedAI: boolean;
  advancedCompare: boolean;
  cloudFavorites: boolean;
  crmTwenty: boolean;
  autopilotAgents: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}

// Constants
export const LANDMAP_TAKE_RATE = 0.02;  // 2% on transactions

export const PLAN_CONFIG: Record<PlanTier, Plan> = {
  free: {
    tier: 'free',
    name: 'Grátis',
    priceBRLMonthly: 0,
    priceBRLYearly: 0,
    cashbackRate: 0,
    limits: { searchesPerDay: 50, aiMessagesPerDay: 10, savedComparisons: 5, agentCyclesPerDay: 0 },
    features: { heatmap: false, unlimitedAI: false, advancedCompare: false, cloudFavorites: false, crmTwenty: false, autopilotAgents: false, whiteLabel: false, apiAccess: false },
  },
  access: {
    tier: 'access',
    name: 'Acesso',
    priceBRLMonthly: 69.90,
    priceBRLYearly: 699,
    cashbackRate: 0.005,
    limits: { searchesPerDay: 500, aiMessagesPerDay: 100, savedComparisons: 50, agentCyclesPerDay: 10 },
    features: { heatmap: true, unlimitedAI: false, advancedCompare: true, cloudFavorites: true, crmTwenty: false, autopilotAgents: false, whiteLabel: false, apiAccess: false },
  },
  plus: {
    tier: 'plus',
    name: 'Plus',
    priceBRLMonthly: 119.90,
    priceBRLYearly: 1199,
    cashbackRate: 0.01,
    limits: { searchesPerDay: -1, aiMessagesPerDay: 500, savedComparisons: 200, agentCyclesPerDay: 50 },
    features: { heatmap: true, unlimitedAI: true, advancedCompare: true, cloudFavorites: true, crmTwenty: false, autopilotAgents: false, whiteLabel: false, apiAccess: true },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    priceBRLMonthly: 249.90,
    priceBRLYearly: 2499,
    cashbackRate: 0.015,
    limits: { searchesPerDay: -1, aiMessagesPerDay: -1, savedComparisons: -1, agentCyclesPerDay: -1 },
    features: { heatmap: true, unlimitedAI: true, advancedCompare: true, cloudFavorites: true, crmTwenty: true, autopilotAgents: true, whiteLabel: false, apiAccess: true },
  },
  business: {
    tier: 'business',
    name: 'Business',
    priceBRLMonthly: 699.90,
    priceBRLYearly: 6999,
    cashbackRate: 0.02,
    limits: { searchesPerDay: -1, aiMessagesPerDay: -1, savedComparisons: -1, agentCyclesPerDay: -1 },
    features: { heatmap: true, unlimitedAI: true, advancedCompare: true, cloudFavorites: true, crmTwenty: true, autopilotAgents: true, whiteLabel: true, apiAccess: true },
  },
};

export const API_KEY_QUOTAS: Record<PlanTier, number> = {
  free: 100,          // 100 req/day
  access: 1000,       // 1k req/day
  plus: 10000,        // 10k req/day
  pro: 100000,        // 100k req/day
  business: 1000000,  // 1M req/day
};
