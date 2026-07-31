# Deployment

Civitas is a standard Next.js 15 app and runs anywhere Next runs. The demo needs
**no environment variables**; connecting Supabase/R2/push is opt-in.

## Option A — Vercel (recommended)

1. Import the repository in Vercel. Framework preset: **Next.js** (auto).
2. Add environment variables from `.env.example` (Supabase, R2, VAPID) in
   **Project → Settings → Environment Variables**.
3. Deploy. `vercel.json` sets correct caching/headers for the service worker and
   manifest.

### CI-driven deploys

`.github/workflows/ci.yml` lints, typechecks and builds on every PR, then
deploys `main` to Vercel **if** these repo secrets are set (otherwise the deploy
job no-ops):

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Option B — Docker

```bash
docker build -t civitas .
docker run -p 3000:3000 --env-file .env.local civitas
```

The multi-stage `Dockerfile` produces a small `node:20-alpine` runtime image and
runs as a non-root user.

## Option C — any Node host

```bash
npm ci
npm run build
npm run start     # listens on $PORT (default 3000)
```

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/schema.sql` then `supabase/seed.sql` (see `docs/DATABASE.md`).
3. Enable Auth providers: **Email**, **Google**, **Apple**. Add passkeys/MFA in
   the Auth settings.
4. Put the project URL + anon key in `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the service-role key server-side only.

## Push notifications

Generate VAPID keys and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`:

```bash
npx web-push generate-vapid-keys
```

The service worker (`public/sw.js`) already handles the fetch/offline lifecycle;
add a `push` event handler and a subscription endpoint to go live.

## Performance & SEO checklist

- Images use `next/image`; wide media lazy-loads.
- Server rendering + streaming for fast first paint.
- Metadata + Open Graph in `app/layout.tsx` and per-route `generateMetadata`.
- `prefers-reduced-motion` honored; semantic HTML + skip link + ARIA for a11y.
- Target Lighthouse ≥ 95 across Performance / A11y / Best Practices / SEO.
