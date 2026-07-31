-- =============================================================================
-- Civitas — Supabase / Postgres schema
-- Production data layer. Mirrors src/lib/types.ts. Apply with the Supabase CLI:
--   supabase db reset            (local)
--   supabase db push             (to a linked project)
-- or paste into the SQL editor. Row Level Security is enabled on every table.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists postgis;      -- geography(Point) for map/nearby

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum
  ('visitor','member','volunteer','moderator','editor','administrator','super_admin');
create type fact_check as enum ('verified','context','disputed','unverified');
create type community_category as enum
  ('local','municipality','province','public-safety','immigration-policy',
   'culture','events','neighborhood-watch','volunteer');
create type event_kind as enum ('meetup','public-meeting','volunteer','workshop','rally');
create type help_kind as enum ('request','offer');
create type help_category as enum ('legal','translation','transport','volunteer','housing','community');
create type help_status as enum ('open','matched','completed');
create type report_status as enum ('open','reviewing','actioned','dismissed');
create type notification_kind as enum
  ('like','comment','mention','community-invite','event-reminder','help-request','moderator');

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null check (handle ~ '^[a-z0-9_]{3,30}$'),
  name          text not null,
  avatar        text,
  bio           text default '',
  role          user_role not null default 'member',
  verified      boolean not null default false,
  location      text,
  interests     text[] not null default '{}',
  badges        jsonb not null default '[]',
  show_location boolean not null default true,
  discoverable  boolean not null default true,
  dm_policy     text not null default 'everyone' check (dm_policy in ('everyone','communities','nobody')),
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Communities
-- ----------------------------------------------------------------------------
create table communities (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  name         text not null,
  tagline      text,
  description  text,
  category     community_category not null default 'local',
  cover        text,
  icon         text,
  location     text,
  rules        text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create table community_members (
  community_id uuid references communities(id) on delete cascade,
  user_id      uuid references profiles(id) on delete cascade,
  is_moderator boolean not null default false,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Posts & comments
-- ----------------------------------------------------------------------------
create table posts (
  id           uuid primary key default uuid_generate_v4(),
  author_id    uuid not null references profiles(id) on delete cascade,
  community_id uuid references communities(id) on delete set null,
  headline     text not null check (char_length(headline) between 3 and 140),
  body         text default '',
  images       text[] not null default '{}',
  video        text,
  geo          geography(Point, 4326),
  location_label text,
  tags         text[] not null default '{}',
  fact_check   fact_check default 'unverified',
  pinned       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index posts_created_idx  on posts (created_at desc);
create index posts_community_idx on posts (community_id);
create index posts_geo_idx on posts using gist (geo);

create table comments (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references posts(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Reactions: like / bookmark / share as a single normalized table.
create table reactions (
  post_id    uuid references posts(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  kind       text not null check (kind in ('like','bookmark','share')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

-- ----------------------------------------------------------------------------
-- News
-- ----------------------------------------------------------------------------
create table news_articles (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  summary           text,
  body              text,
  cover             text,
  author_id         uuid references profiles(id) on delete set null,
  category          text,
  sources           jsonb not null default '[]',   -- [{label,url}]
  references_        text[] not null default '{}',
  fact_check         fact_check not null default 'unverified',
  reading_minutes    int not null default 1,
  verified_by_editor boolean not null default false,
  published_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Events & RSVPs
-- ----------------------------------------------------------------------------
create table events (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  cover        text,
  kind         event_kind not null default 'meetup',
  host_id      uuid references profiles(id) on delete set null,
  community_id uuid references communities(id) on delete set null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  geo          geography(Point, 4326),
  venue        text,
  capacity     int not null default 100,
  tags         text[] not null default '{}'
);

create table event_rsvps (
  event_id uuid references events(id) on delete cascade,
  user_id  uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Help network
-- ----------------------------------------------------------------------------
create table help_listings (
  id           uuid primary key default uuid_generate_v4(),
  kind         help_kind not null,
  category     help_category not null,
  title        text not null,
  details      text,
  author_id    uuid not null references profiles(id) on delete cascade,
  geo          geography(Point, 4326),
  location_label text,
  status       help_status not null default 'open',
  matched_with uuid references profiles(id),
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Messaging
-- ----------------------------------------------------------------------------
create table conversations (
  id             uuid primary key default uuid_generate_v4(),
  kind           text not null check (kind in ('direct','group')),
  title          text,
  encrypted      boolean not null default true,
  last_message_at timestamptz not null default now()
);
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text,
  kind            text not null default 'text' check (kind in ('text','image','voice','file')),
  attachment      text,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------------------------
create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       notification_kind not null,
  actor_id   uuid references profiles(id) on delete set null,
  text       text not null,
  href       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Moderation
-- ----------------------------------------------------------------------------
create table reports (
  id          uuid primary key default uuid_generate_v4(),
  target_type text not null check (target_type in ('post','comment','user','news')),
  target_id   uuid not null,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason      text not null,
  details     text,
  status      report_status not null default 'open',
  spam_score  numeric(3,2) not null default 0,
  created_at  timestamptz not null default now()
);

create table audit_log (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid references profiles(id) on delete set null,
  action     text not null,
  target     text not null,
  created_at timestamptz not null default now()
);

create table feature_flags (
  key         text primary key,
  label       text not null,
  description text,
  enabled     boolean not null default false,
  rollout     int not null default 0 check (rollout between 0 and 100)
);

-- ----------------------------------------------------------------------------
-- Helper: role check for the current user
-- ----------------------------------------------------------------------------
create or replace function current_role_at_least(min_role user_role)
returns boolean language sql stable security definer as $$
  select coalesce(
    (select role >= min_role from profiles where id = auth.uid()),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table profiles       enable row level security;
alter table communities    enable row level security;
alter table community_members enable row level security;
alter table posts          enable row level security;
alter table comments       enable row level security;
alter table reactions      enable row level security;
alter table news_articles  enable row level security;
alter table events         enable row level security;
alter table event_rsvps    enable row level security;
alter table help_listings  enable row level security;
alter table conversations  enable row level security;
alter table conversation_participants enable row level security;
alter table messages       enable row level security;
alter table notifications  enable row level security;
alter table reports        enable row level security;
alter table audit_log      enable row level security;
alter table feature_flags  enable row level security;

-- Profiles: world-readable when discoverable; users edit only their own.
create policy "profiles readable"      on profiles for select using (discoverable or id = auth.uid());
create policy "profiles self-update"   on profiles for update using (id = auth.uid());
create policy "profiles self-insert"   on profiles for insert with check (id = auth.uid());

-- Communities & posts: public read; authenticated create; author (or moderator) edit.
create policy "communities read"  on communities for select using (true);
create policy "posts read"        on posts for select using (true);
create policy "posts insert"      on posts for insert with check (author_id = auth.uid());
create policy "posts update own"  on posts for update
  using (author_id = auth.uid() or current_role_at_least('moderator'));
create policy "posts delete own"  on posts for delete
  using (author_id = auth.uid() or current_role_at_least('moderator'));

create policy "comments read"     on comments for select using (true);
create policy "comments insert"   on comments for insert with check (author_id = auth.uid());
create policy "comments delete"   on comments for delete
  using (author_id = auth.uid() or current_role_at_least('moderator'));

create policy "reactions read"    on reactions for select using (true);
create policy "reactions write"   on reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "news read"         on news_articles for select using (true);
create policy "news editor write" on news_articles for all
  using (current_role_at_least('editor')) with check (current_role_at_least('editor'));

create policy "events read"       on events for select using (true);
create policy "events insert"     on events for insert with check (host_id = auth.uid());
create policy "rsvps read"        on event_rsvps for select using (true);
create policy "rsvps write"       on event_rsvps for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "help read"         on help_listings for select using (true);
create policy "help insert"       on help_listings for insert with check (author_id = auth.uid());
create policy "help update own"   on help_listings for update using (author_id = auth.uid());

-- Messaging: participants only.
create policy "conv participant read" on conversations for select
  using (exists (select 1 from conversation_participants p where p.conversation_id = id and p.user_id = auth.uid()));
create policy "participants read" on conversation_participants for select using (user_id = auth.uid());
create policy "messages read" on messages for select
  using (exists (select 1 from conversation_participants p where p.conversation_id = conversation_id and p.user_id = auth.uid()));
create policy "messages send" on messages for insert with check (sender_id = auth.uid());

-- Notifications: owner only.
create policy "notifications own" on notifications for select using (user_id = auth.uid());
create policy "notifications update own" on notifications for update using (user_id = auth.uid());

-- Reports: reporter can create; moderators can read/triage.
create policy "reports insert" on reports for insert with check (reporter_id = auth.uid());
create policy "reports moderator read" on reports for select using (current_role_at_least('moderator'));
create policy "reports moderator update" on reports for update using (current_role_at_least('moderator'));

-- Audit log & feature flags: admin-only.
create policy "audit admin read"  on audit_log for select using (current_role_at_least('administrator'));
create policy "flags read"        on feature_flags for select using (true);
create policy "flags admin write" on feature_flags for all
  using (current_role_at_least('administrator')) with check (current_role_at_least('administrator'));

-- Community membership: self join/leave; read public.
create policy "members read"  on community_members for select using (true);
create policy "members write" on community_members for all using (user_id = auth.uid()) with check (user_id = auth.uid());
