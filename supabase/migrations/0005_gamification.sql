-- Gamification persistence (Phase 2B: wire LandCoins to DB)

create table if not exists user_progress (
  user_id text primary key,
  xp integer not null default 0,
  level integer not null default 1,
  tier text not null default 'bronze',
  landcoins integer not null default 0,
  metrics jsonb not null default '{"searches":0,"favoritesSaved":0,"comparisonsMade":0,"agentCycles":0,"neighborhoodsExplored":0,"referrals":0,"dealsClosed":0}',
  streak jsonb not null default '{"current":0,"best":0,"lastActiveDate":null,"freezes":0}',
  badges text[] not null default '{}',
  quests jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references user_progress(user_id),
  kind text not null,
  landcoins_delta integer not null,
  balance_after integer not null,
  note text,
  created_at timestamptz not null default now()
);

create index on user_progress(tier);
create index on user_progress(landcoins);
create index on coin_ledger(user_id);
create index on coin_ledger(kind);

alter table user_progress enable row level security;
alter table coin_ledger enable row level security;

create policy "users see own progress" on user_progress for select
  using (auth.uid()::text = user_id);

create policy "users see own ledger" on coin_ledger for select
  using (user_id in (select user_id from user_progress where auth.uid()::text = user_id));
