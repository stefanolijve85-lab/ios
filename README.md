# Civitas — Civic Participation Platform

A modern, mobile-first web platform where citizens connect, share information and
organize around civic topics — immigration policy, public safety, democratic
values and community engagement — through **lawful, respectful** participation.

Built with **Next.js 15 (App Router), React 19, TypeScript, TailwindCSS and
Framer Motion**, with a premium glassmorphism dark-mode UI and full PWA support.

> **Core principles.** Civitas promotes lawful civic participation and respectful
> discussion, supports freedom of expression within the law, and allows debate on
> migration, integration and public policy. It never encourages violence,
> harassment or discrimination. Every user follows the
> [community guidelines](src/app/(app)/guidelines/page.tsx), and moderators have
> transparent tools with an appeal process. See `/guidelines` in the app.

---

## ✨ What's built

The app runs **end-to-end today** on an in-memory seed layer — no external
services or secrets required — so every screen is clickable and functional.

| Area | Route | Status |
| --- | --- | --- |
| **Home feed** (For you / Latest / Trending / Nearby / Following) | `/` | ✅ Functional |
| Post detail + comments + reactions | `/post/[id]` | ✅ |
| **Communities** directory + detail (rules, pinned, mods, stats) | `/communities`, `/c/[slug]` | ✅ |
| **News** (sources, fact-check, reading time, editor-verified) | `/news`, `/news/[id]` | ✅ |
| **Events** (RSVP, capacity, calendar/QR/map affordances) | `/events`, `/events/[id]` | ✅ |
| **Interactive map** (clustering-style markers, filters, search) | `/map` | ✅ |
| **Help network** (requests/offers, matching, status) | `/help` | ✅ |
| **Messaging** (DM + group, encrypted, image/voice affordances) | `/messages` | ✅ |
| **Notifications** | `/notifications` | ✅ |
| **Global search** (posts, users, communities, events, news) | `/search` | ✅ |
| **Profiles** (bio, badges, roles, interests, privacy) | `/u/[handle]` | ✅ |
| **Moderation** (queue, spam scores, audit log, appeals) | `/moderation` | ✅ role-gated |
| **Admin** (analytics, users, feature flags, roles) | `/admin` | ✅ role-gated |
| **Auth** (email, Google, Apple, passkey, 2FA UI) | `/signin`, `/signup` | ✅ UI |
| **PWA** (manifest, service worker, offline page) | — | ✅ |
| REST API routes | `/api/*` | ✅ |

The **production database** is fully specified in [`supabase/schema.sql`](supabase/schema.sql)
(Postgres + PostGIS + Row Level Security), structurally mirroring the app types.
`src/lib/db.ts` is the single seam to swap the mock layer for Supabase queries.

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

No environment variables are needed to run the demo. To connect real services,
copy `.env.example` → `.env.local` and fill in Supabase / R2 / VAPID keys.

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## 🧱 Tech stack

- **Next.js 15** App Router — RSC, streaming, route handlers, SSR + static.
- **React 19** + **TypeScript** (strict).
- **TailwindCSS** design system driven by CSS variables (light/dark themes).
- **Framer Motion** for 60fps transitions (respects `prefers-reduced-motion`).
- **Supabase** (Postgres + Auth + Realtime) — production data layer & RLS.
- **Cloudflare R2** — S3-compatible media storage.
- **PWA** — installable, offline app-shell caching, web-push ready.
- Zero UI runtime dependencies beyond React/Framer: icons, charts and the map
  are hand-built inline SVG (small bundle, no CDN, works offline).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the folder structure and
data-flow, [`docs/DATABASE.md`](docs/DATABASE.md) for the schema and seeding, and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for shipping to Vercel.

---

## 👥 Example accounts, communities & content

Seeded in [`src/data/seed.ts`](src/data/seed.ts):

- **Users** across every role — `@amara` (administrator), `@daan` (moderator),
  `@leyla` (editor / verified lawyer), `@marco` (volunteer), `@sanne` (editor /
  press), `@youssef` (newcomer member).
- **Communities** — Rotterdam West, Newcomers Network, Safe Streets,
  Immigration & Policy, Volunteer NL.
- Posts, news articles, events, help listings, conversations, notifications,
  reports and an audit log — enough to make every screen feel alive.

The signed-in demo user is **Amara** (administrator) so you can see the
moderation and admin surfaces.

---

## 🔐 Roles

`visitor → member → volunteer → moderator → editor → administrator → super_admin`

Roles are ordered; `roleAtLeast()` gates navigation and (in production) RLS
policies via `current_role_at_least()`.

## 🛡️ Security & moderation

OWASP-minded: strict security headers, input validation on API routes, RLS on
every table, rate-limiting hooks, and an audit log. AI features (summaries, spam
scoring, duplicate/translation) are **assistive only — humans make every final
moderation call**, and members can appeal. See [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 📄 License

Provided as a reference implementation for civic-tech projects.
