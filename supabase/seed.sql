-- =============================================================================
-- Civitas — seed data
-- Communities and feature flags seed cleanly (no auth dependency).
-- Profiles/posts reference auth.users, so example users are created through the
-- app seed script (scripts/seed.md) or the Supabase Auth Admin API, then their
-- profile rows are inserted. See docs/DATABASE.md.
-- =============================================================================

insert into feature_flags (key, label, description, enabled, rollout) values
  ('ai_summaries','AI article summaries','Short summaries for long news articles (human review required).', true, 100),
  ('ai_spam','AI spam scoring','Assist moderators with a spam-likelihood score.', true, 60),
  ('nearby_feed','Nearby feed','Location-aware feed tab.', true, 100),
  ('passkeys','Passkey sign-in','WebAuthn passwordless authentication.', false, 10),
  ('voice_notes','Voice notes in chat','Record and send short audio messages.', false, 0)
on conflict (key) do nothing;

insert into communities (slug, name, tagline, description, category, icon, location, rules) values
  ('rotterdam-west','Rotterdam West','Everything happening in our part of the city.',
   'A place for residents of Rotterdam-West to share local news and coordinate initiatives.',
   'local','🏙️','Rotterdam, NL',
   array['Be respectful — debate ideas, not people.','No harassment, hate speech or threats.','Keep it local and lawful.','Cite sources when you share news.']),
  ('newcomers','Newcomers Network','Practical help for people settling in.',
   'Language buddies, paperwork help, job leads and friendly faces.',
   'immigration-policy','🧭','Netherlands',
   array['Kindness first.','No legal advice without disclaimers.','Protect people''s privacy.']),
  ('safe-streets','Safe Streets','Public safety, discussed with data and respect.',
   'Neighborhood watch coordination and evidence-based conversation about public safety.',
   'public-safety','🛡️','Netherlands',
   array['Report facts, not rumors.','No vigilantism.','Respect privacy — no doxxing.']),
  ('immigration-policy','Immigration & Policy','Understanding the rules that shape our communities.',
   'Fact-checked explainers and civil debate about immigration and integration. Sources required.',
   'immigration-policy','📜','Netherlands',
   array['Sources required for claims.','Debate policy, respect people.','No dehumanizing language.']),
  ('volunteer','Volunteer NL','Give a few hours, change someone''s week.',
   'Coordinating food runs, tutoring, transport and community events.',
   'volunteer','🤝','Netherlands',
   array['Show up when you commit.','Keep vulnerable people safe.','No solicitation.'])
on conflict (slug) do nothing;
