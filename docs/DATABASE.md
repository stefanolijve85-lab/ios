# Database

The production data layer is **Supabase** (Postgres 15 + PostGIS + Row Level
Security). The full schema lives in [`../supabase/schema.sql`](../supabase/schema.sql)
and mirrors the TypeScript domain model in `src/lib/types.ts`.

## Tables

| Table | Purpose |
| --- | --- |
| `profiles` | 1:1 with `auth.users`; handle, role, verification, privacy, badges |
| `communities`, `community_members` | communities + membership/moderator flags |
| `posts`, `comments`, `reactions` | feed content and interactions (`geo` = PostGIS point) |
| `news_articles` | editor-verified articles with `sources`, `references`, fact-check |
| `events`, `event_rsvps` | events with capacity + RSVPs |
| `help_listings` | mutual-aid requests/offers with matching + status |
| `conversations`, `conversation_participants`, `messages` | messaging |
| `notifications` | per-user activity |
| `reports`, `audit_log` | moderation queue + transparent action log |
| `feature_flags` | admin-controlled rollout switches |

## Enums

`user_role`, `fact_check`, `community_category`, `event_kind`, `help_kind`,
`help_category`, `help_status`, `report_status`, `notification_kind`.

`user_role` is **ordered** (`visitor < member < … < super_admin`), so RLS can use
`role >= 'moderator'` via the `current_role_at_least()` helper.

## Row Level Security

RLS is enabled on **every** table. Highlights:

- Public content (posts, communities, news, events) is world-readable.
- Writes are constrained to the owner (`author_id = auth.uid()`) or a
  sufficiently privileged role.
- Messaging is restricted to conversation participants.
- Reports are insert-by-anyone, read/triage-by-moderators.
- `audit_log` and `feature_flags` writes are administrator-only.

## Applying the schema

```bash
# Local Supabase
supabase start
supabase db reset            # applies schema.sql + seed.sql

# Linked project
supabase link --project-ref <ref>
supabase db push
```

Or paste `schema.sql` then `seed.sql` into the Supabase SQL editor.

## Seeding

- `supabase/seed.sql` seeds **communities** and **feature flags** cleanly (no
  auth dependency).
- **Example users/posts** reference `auth.users`, so create them via the Auth
  Admin API (or the app sign-up flow), then insert matching `profiles` rows. The
  canonical example content is in `src/data/seed.ts` — port those records to SQL
  once the auth user IDs exist.

## Media storage

Images/video/voice are stored in **Cloudflare R2** (S3-compatible). Store only
the object URL in Postgres (`posts.images`, `messages.attachment`, covers).
Configure R2 via `.env` (`R2_*`).
