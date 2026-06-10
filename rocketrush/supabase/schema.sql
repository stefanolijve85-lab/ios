-- Liftoff X — Supabase schema (run in the Supabase SQL editor).
-- Auth is handled by Supabase Auth (auth.users). These tables hold the demo
-- wallet, statistics, bet history and transactions, all keyed by the user id.
-- The game server writes with the service-role key (bypasses RLS); the policies
-- below let a logged-in user read their own rows directly if you ever want to.

create table if not exists public.wallets (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  balance    numeric(14,2) not null default 1000,
  updated_at timestamptz not null default now()
);

create table if not exists public.stats (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  played       integer not null default 0,
  wins         integer not null default 0,
  wagered      numeric(16,2) not null default 0,
  returned     numeric(16,2) not null default 0,
  best         numeric(12,2) not null default 0,
  best_win     numeric(16,2) not null default 0,
  streak       integer not null default 0,
  best_streak  integer not null default 0,
  updated_at   timestamptz not null default now()
);

create table if not exists public.bets (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  nonce      bigint,
  amount     numeric(14,2) not null,
  won        boolean not null,
  mult       numeric(12,2),
  payout     numeric(16,2) not null default 0,
  profit     numeric(16,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists bets_user_created_idx on public.bets (user_id, created_at desc);

create table if not exists public.transactions (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,                       -- signup_bonus|bet|win|refund|reset|reup
  amount       numeric(16,2) not null,
  balance_after numeric(14,2) not null,
  created_at   timestamptz not null default now()
);
create index if not exists tx_user_created_idx on public.transactions (user_id, created_at desc);

-- Row Level Security: a user may only see their own rows.
alter table public.wallets       enable row level security;
alter table public.stats         enable row level security;
alter table public.bets          enable row level security;
alter table public.transactions  enable row level security;

create policy "own wallet"  on public.wallets      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own stats"   on public.stats        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bets"    on public.bets         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tx"      on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
