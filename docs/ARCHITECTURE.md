# Architecture

## Overview

Civitas is a Next.js 15 App-Router application. It renders as much as possible on
the server (React Server Components) and hydrates small islands of interactivity
(feed tabs, composer, reactions, chat, filters). All shared data flows through a
single data-access module, `src/lib/db.ts`, which today reads an in-memory seed
and is the one place you swap for Supabase in production.

```
Browser (PWA)
  │  RSC payload + small client islands
  ▼
Next.js App Router  ──►  Route Handlers (/api/*)
  │                         │
  ▼                         ▼
src/lib/db.ts  ◄────────────┘      ← single data seam
  │
  ├─ dev/demo:  src/data/seed.ts   (in-memory)
  └─ prod:      Supabase (Postgres + RLS + Realtime) / Cloudflare R2
```

## Folder structure

```
src/
  app/
    layout.tsx              # root: <html>, providers, PWA, metadata
    globals.css             # design tokens + component classes
    not-found.tsx
    (app)/                  # route group WITH the app shell (sidebar/bottom nav)
      layout.tsx
      page.tsx              # home feed
      communities/…  c/[slug]/…
      post/[id]/…  news/…  events/…
      map/  help/  messages/  notifications/  search/
      u/[handle]/           # profiles
      moderation/  admin/   # role-gated
      guidelines/  offline/
    (auth)/                 # route group WITHOUT the shell (centered)
      layout.tsx  signin/  signup/
    api/                    # REST route handlers
      posts/  search/  communities/  health/
  components/
    AppShell.tsx            # sidebar + top bar + bottom nav + composer
    PostCard, PostActions, HomeFeed, CommentThread, Composer
    RsvpButton, StaticMap, Charts, FeatureFlags, ServiceWorker, AuthForm
    ui/                     # Icon (inline SVG set), Logo, Primitives
  context/AppProvider.tsx   # theme, session, likes/bookmarks/RSVPs, composer
  data/seed.ts              # example users, communities, posts, …
  lib/
    types.ts                # domain model (source of truth)
    db.ts                   # data-access API (the swap seam)
    nav.ts                  # navigation config (+ role gating)
    format.ts               # time/number/text helpers
supabase/
  schema.sql  seed.sql      # Postgres schema (RLS) + seed
public/
  manifest.webmanifest  sw.js  icons/
```

## Rendering strategy

- **Server Components by default.** Pages fetch through `db.ts` and stream HTML.
  Dynamic routes (`/post/[id]`, `/c/[slug]`, `/u/[handle]`, `/events/[id]`,
  `/news/[id]`) use Next 15 async `params`.
- **Client islands** are the only `'use client'` files: anything with state or
  interaction. This keeps the shared JS bundle ~105 kB.
- **No hydration drift.** Relative timestamps are anchored to a fixed seed "now"
  (`src/lib/format.ts`) so server and client agree.

## Design system

`globals.css` defines semantic color tokens as RGB channel triples in CSS
variables (`--bg`, `--surface`, `--brand`, …). Tailwind maps them to utilities
(`bg-surface`, `text-brand`, …) with `<alpha-value>` support. Switching
`:root.light` re-themes the whole app; the toggle lives in `AppProvider`.
Reusable classes (`.glass`, `.card`, `.btn-primary`, `.input`, `.chip`) compose
the Apple/Linear/Arc-inspired look.

## Swapping in Supabase

`db.ts` exposes narrow functions (`getFeed`, `getCommunity`, `search`, …). To go
live:

1. Apply `supabase/schema.sql`.
2. Replace each function body with a Supabase query (the return shapes already
   match `types.ts`). RLS enforces authorization server-side.
3. Move reactions/RSVPs from `AppProvider` local state to `reactions` /
   `event_rsvps` tables via the API routes.

Because every consumer imports from `db.ts` (never from `seed.ts`), the UI needs
no changes.
