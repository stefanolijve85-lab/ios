# 18 — Live Ops Roadmap (Year 1)

## Cadence

| Frequency | Activity |
|---|---|
| Daily | Daily missions roll, leaderboard reset (weekly bucket). |
| Weekly | Theme event "Watermelon Wednesday", Friday "Featured" rotation. |
| Bi-weekly | Balance tweaks via Remote Config. |
| Monthly | New Battle Pass season (30 days). |
| Quarterly | Major content drop (new biome, new launcher tier, new projectile family). |
| Yearly | Anniversary mega-event (event + free legendary). |

## Quarter 1 (Launch → +12 weeks)

| Week | Drop |
|---|---|
| W0 | Global launch. |
| W2 | Battle Pass Season 2 ("Backyard BBQ"). |
| W3 | Event: "Watermelon Wednesday" (x2 watermelon coins). |
| W4 | New projectile: Bubble Wrap Ball (giant bouncer). |
| W6 | Limited-time biome variant: "Backyard at Night" (different obstacles + lighting). |
| W8 | Battle Pass Season 3 ("Farm Frenzy"). |
| W10 | Live community challenge: collective distance leaderboard. |
| W12 | Anniversary-mini: a year-1 retrospective infographic in-app. |

## Quarter 2 (W13–W24)

- New biome: **Pirate Cove** (with tide-driven boost pads).
- New launcher tier: Plasma Mk II skin variants.
- Friends list + async PvP "Mirror Match" (your replay vs theirs, scored).
- Cosmetic line: "Royal Court" (15 items).
- First brand collab opportunity slot.

## Quarter 3 (W25–W36)

- New biome: **Underwater**.
- New mechanic: chargeable mid-air ability (long-press).
- Battle Pass theme: "Deep Sea Treasure".
- Replay sharing (export 10-second GIF for socials).
- Achievement tier expansion (Achievement 2.0 with badges).

## Quarter 4 (W37–W48)

- New biome: **Volcano** (rising lava floor, time pressure).
- Boss Rush mode: 5 bosses, leaderboard.
- Holiday seasonal event (limited cosmetics).
- Cross-promotion with our publisher's other titles (cosmetic rewards via deep linking).

## Event Catalog

| Event | Mechanic | Frequency |
|---|---|---|
| Watermelon Wednesday | x2 melon coins | Weekly |
| Crit Friday | x2 crit chance | Weekly |
| Distance Marathon | Track collective km, milestone rewards | Monthly |
| Boss Rush Weekend | Boss-only runs, leaderboard | Bi-monthly |
| 24h Free Skin | Random cosmetic free for 24h | Monthly |
| Mega Magnet Tuesday | Magnet radius x2 | Weekly |

## Content Budget Per Quarter

| Asset | Count |
|---|---|
| New projectiles | 2–3 |
| New launcher skins | 4 |
| Trail effects | 3 |
| Pets | 2 |
| Biome | 1 (sometimes 0 if focusing on systems) |
| Boss | 1 |
| Battle pass tiers | 50 (per month) |
| Cosmetic items in BP | ~30 unique |

## Tools / Pipelines for LiveOps

- **Remote Config** dashboard with named variants and rollouts.
- **A/B framework**: every change ships behind a flag, default OFF.
- **Server-pushed content packs** via Addressables — no app update required.
- **Heatmaps**: where players "settle" most, replayed on dashboards weekly.

## KPI Watchlist (per release)

| Metric | Direction | Reaction if missed |
|---|---|---|
| D1 retention | ≥ baseline | Rollback BP, reduce difficulty in phase 1 |
| ARPDAU | ≥ baseline | Re-shelve cosmetics, tune crate odds (within disclosure rules) |
| Session length | flat or up | Investigate friction; check VFX cost |
| Crash-free | ≥ 99.5% | Immediate hotfix |
| Refund rate | ≤ 0.5% | Audit BP value clarity, IAP descriptions |

## Community

- Discord server with mod team (paid).
- Bi-weekly community letter via in-app inbox.
- Quarterly playtest invitations for community members.
- Bug bounty: top reporter gets in-game vanity badge.

## Marketing Mix

- **Always on:** Facebook/Instagram, TikTok, AppLovin UA.
- **Spike campaigns:** Reddit AMA at quarter starts; YouTube creator codes.
- **Brand partnerships:** Year 2 target — 1 movie/show tie-in cosmetic line.

## Long-Term North Stars

- D30 retention ≥ 10% by end of Y1.
- 60% of MAU on the current Battle Pass tier ≥ 10.
- Net Promoter Score ≥ 35.
- 4.5+ stars on both stores with > 25k ratings.
