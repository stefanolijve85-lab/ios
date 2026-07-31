# Security & Moderation

Civitas is built to be OWASP-minded and to keep humans in control of moderation.

## Application security

| Control | Where |
| --- | --- |
| Security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`) | `next.config.js` |
| Input validation on writes (length, type, referential checks) | `src/app/api/posts/route.ts` |
| Row Level Security on every table | `supabase/schema.sql` |
| Role-based access (`roleAtLeast`, `current_role_at_least`) | `src/lib/types.ts`, schema |
| Secrets kept server-side (service-role key never shipped to client) | `.env` conventions |
| XSS-safe rendering (React escaping; no `dangerouslySetInnerHTML`) | throughout |
| CSRF | Supabase auth uses bearer tokens, not ambient cookies, for API calls |

### Recommended additions before production

- **Rate limiting** on `/api/*` (e.g. Upstash Ratelimit or Vercel middleware).
- **CSP** header once the asset origins are fixed.
- **2FA/passkeys** enforced for moderator+ roles (Supabase MFA / WebAuthn).
- **Audit everything** privileged — the `audit_log` table is ready.

## Moderation model

- **Report → queue → review → action → appeal.** Reports land in
  `/moderation`; moderators dismiss / warn / remove; every action is written to
  the audit log; affected members can appeal.
- **Transparency.** The audit log is visible to moderators and admins; rules
  apply equally to everyone.
- **Rate limiting & spam detection** reduce abuse without silencing debate.

## AI features — assistive, never autonomous

The planned AI features (article summaries, duplicate detection, spam scoring,
translation, recommendations, accessibility and moderator assistance) are
designed to **support** users and moderators, **not replace human oversight**:

- Spam scores and duplicate flags are **suggestions**; a moderator makes the
  final call (see the note in `/moderation`).
- Summaries and translations are labeled and reviewable.
- No automated account suspensions without human confirmation.

## Reporting a vulnerability

Email `security@civitas.example` (placeholder). Do not open public issues for
security reports.
