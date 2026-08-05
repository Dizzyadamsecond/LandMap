-- Token wallets & mint requests (Phase 2-3: testnet + mainnet bridge)

create table if not exists token_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  chain_address text not null,
  chain text not null default 'sepolia',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists token_mint_requests (
  id text primary key,
  user_id text not null references token_wallets(user_id),
  wallet_address text not null,
  landcoins_spent numeric not null,
  tokens_minted numeric not null,
  tx_hash text,
  status text not null default 'pending',
  chain text not null default 'sepolia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on token_wallets(user_id);
create index on token_mint_requests(user_id);
create index on token_mint_requests(status);

alter table token_wallets enable row level security;
alter table token_mint_requests enable row level security;

create policy "users see own wallet" on token_wallets for select
  using (auth.uid()::text = user_id);

create policy "users see own mint requests" on token_mint_requests for select
  using (user_id in (select user_id from token_wallets where auth.uid()::text = user_id));
