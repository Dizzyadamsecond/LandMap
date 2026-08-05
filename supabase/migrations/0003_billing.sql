-- LandMap Billing Schema — Marketplace transacional real
-- Data: 2026-08-05
-- Estende o schema Supabase existente (0001_init.sql, 0002_api_properties.sql)
-- com tabelas de subscription, payment, cashback e webhook tracking.
-- RLS: owner-only para tabelas sensíveis (referencia auth.users(id))

-- ──────────────────────────────────────────────────────────────────────────
-- Subscriptions (SaaS plans B2C — free/access/plus/pro/business)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  tier                     text not null check (tier in ('free','access','plus','pro','business')),
  status                   text not null default 'active' check (status in ('active','canceled','past_due','trialing')),
  gateway                  text check (gateway in ('mercadopago','stripe')),
  gateway_customer_id      text,
  gateway_subscription_id  text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  unique(user_id, gateway_subscription_id)  -- evita duplicatas por gateway
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_tier on public.subscriptions(tier);
create index idx_subscriptions_status on public.subscriptions(status);

-- RLS: owner-only
alter table public.subscriptions enable row level security;
create policy "subscriptions_owner_select" on public.subscriptions for select
  using (auth.uid() = user_id);
create policy "subscriptions_owner_all" on public.subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Payments (transações reais do gateway)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  subscription_id      uuid references public.subscriptions(id) on delete set null,
  gateway              text not null check (gateway in ('mercadopago','stripe')),
  gateway_payment_id   text not null,
  amount_cents         integer not null,
  currency             text not null default 'BRL',
  status               text not null default 'pending',  -- pending|approved|rejected|refunded|charged_back|expired
  method               text,                              -- pix|boleto|credit_card
  raw_payload          jsonb,                             -- webhook cru (p/ auditoria/replay)
  created_at           timestamptz not null default now(),

  unique(gateway, gateway_payment_id)  -- evita duplicatas por ID do gateway
);

create index idx_payments_user on public.payments(user_id);
create index idx_payments_subscription on public.payments(subscription_id);
create index idx_payments_status on public.payments(status);
create index idx_payments_gateway_id on public.payments(gateway, gateway_payment_id);

alter table public.payments enable row level security;
create policy "payments_owner_select" on public.payments for select
  using (auth.uid() = user_id);
-- (insert/update restritos ao backend via service role, não user anon)

-- ──────────────────────────────────────────────────────────────────────────
-- Webhook Events — Idempotência (gateway, event_id → evita double-processing)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.webhook_events_billing (
  gateway              text not null check (gateway in ('mercadopago','stripe')),
  event_id             text not null,
  received_at          timestamptz not null default now(),
  processed_at         timestamptz,

  primary key (gateway, event_id)
);

create index idx_webhook_events_processed on public.webhook_events_billing(processed_at);

-- RLS: não necessário (service role interno, nunca consultado por users)

-- ──────────────────────────────────────────────────────────────────────────
-- API Keys (B2B — public API monetizada)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'Default API Key',
  key_hash     text not null unique,          -- SHA-256 da chave (nunca em claro)
  key_prefix   text not null,                 -- 'lm_live_...' primeiros 12 chars (display)
  tier         text not null default 'free' check (tier in ('free','access','plus','pro','business')),
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

create index idx_api_keys_user on public.api_keys(user_id);
create index idx_api_keys_hash on public.api_keys(key_hash);
create index idx_api_keys_revoked on public.api_keys(revoked_at);

alter table public.api_keys enable row level security;
create policy "api_keys_owner_select" on public.api_keys for select
  using (auth.uid() = user_id);
create policy "api_keys_owner_all" on public.api_keys for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- API Key Usage (metered, p/ billing usage-based)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.api_key_usage (
  id          bigserial primary key,
  api_key_id  uuid not null references public.api_keys(id) on delete cascade,
  route       text not null,                  -- ex: '/api/v1/property/valuation'
  status_code int not null default 200,
  cost_units  integer not null default 1,     -- p/ usage-based billing
  created_at  timestamptz not null default now()
);

create index idx_api_key_usage_key_id on public.api_key_usage(api_key_id);
create index idx_api_key_usage_route on public.api_key_usage(route);
create index idx_api_key_usage_date on public.api_key_usage(created_at);

-- RLS: não necessário (service role interno)

-- ──────────────────────────────────────────────────────────────────────────
-- Cashback Transactions (gamificação → cashback real)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.cashback_txns (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  kind              text not null check (kind in ('buyer','seller','referral')),
  amount_cents      integer not null,
  status            text not null default 'pending' check (status in ('pending','confirmed','released','reversed')),
  deal_value_cents  integer,                  -- valor da transação que gerou o cashback
  released_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index idx_cashback_txns_user on public.cashback_txns(user_id);
create index idx_cashback_txns_status on public.cashback_txns(status);
create index idx_cashback_txns_kind on public.cashback_txns(kind);

alter table public.cashback_txns enable row level security;
create policy "cashback_txns_owner_select" on public.cashback_txns for select
  using (auth.uid() = user_id);
-- (insert restritos ao backend)

-- ──────────────────────────────────────────────────────────────────────────
-- Referral Program (convite de amigos → cashback)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  code           text primary key,
  referrer_id    uuid not null references auth.users(id) on delete cascade,
  referred_id    uuid references auth.users(id) on delete set null,
  status         text not null default 'sent' check (status in ('sent','signed_up','closed_won','rewarded')),
  reward_cents   integer not null default 5000,  -- padrão: R$50
  created_at     timestamptz not null default now()
);

create index idx_referrals_referrer on public.referrals(referrer_id);
create index idx_referrals_referred on public.referrals(referred_id);
create index idx_referrals_status on public.referrals(status);

alter table public.referrals enable row level security;
create policy "referrals_read_own_or_referred" on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);
create policy "referrals_owner_insert" on public.referrals for insert
  with check (auth.uid() = referrer_id);
