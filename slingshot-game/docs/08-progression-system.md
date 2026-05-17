# 08 — Progression System

## 1. The Five Progression Vectors

A great mid-core game has *parallel* progression so different player archetypes feel rewarded:

| Vector | Driven By | Primary Reward |
|---|---|---|
| **Player Level (XP)** | Distance run, missions | Unlocks projectiles, launcher tiers, biomes |
| **Upgrade Tree** | Coin spend | Stat bumps (power, bounce, etc.) |
| **Cosmetics Collection** | Crates, BP, IAP | Skins, trails, pets |
| **Battle Pass Tier** | XP earned (capped) | Rotating seasonal goodies |
| **Prestige** | Soft reset | Permanent +5% multiplier per prestige, vanity badge |

## 2. Player XP Curve

```
xpForLevel(n) = 100 * n^1.45
```

| Level | XP to next | Cumulative | Hours to reach (avg player) |
|---|---|---|---|
| 1 | 100 | 100 | <0.1 |
| 5 | 500 | 1,360 | 0.5 |
| 10 | 1,650 | 6,200 | 2.5 |
| 25 | 7,200 | 50,000 | ~12 |
| 50 | 22,500 | 350,000 | ~50 |
| 75 | 47,500 | 1,200,000 | ~140 |
| 100 | 88,000 | 3,400,000 | ~300 |

Sources:
- Run: distance / 10 XP (capped at 500 XP/run).
- Mission: 100–500 XP.
- Daily reward: 200 XP.
- Achievement: 1000 XP.

## 3. Unlock Schedule

Every level gives **either** a feature unlock or a cosmetic drop, never empty:

| Level | Unlock |
|---|---|
| 2 | Projectile: Baseball |
| 3 | Boost tap window highlighted |
| 4 | Projectile: Apple |
| 5 | Daily missions |
| 6 | Projectile: Rock + Farm biome |
| 8 | Projectile: Bowling ball |
| 10 | Battle pass |
| 12 | Launcher tier 2 unlock at shop |
| 15 | City Rooftops biome |
| 20 | Achievement system |
| 25 | Cosmetic showcase / equip menu |
| 30 | Construction zones |
| 35 | Launcher tier 3 |
| 40 | Desert canyon |
| 45 | Prestige offer eligibility (also requires 1 launcher tier 4) |

## 4. Upgrade Tree (Stat Vector)

Six branches, each level adds % to stat. Costs follow geometric growth:

```
costForUpgradeTier(t) = baseCost * (1.18)^t
```

| Branch | Base Cost | Per-level Effect | Soft Cap |
|---|---|---|---|
| Power | 100 | +3% impulse | Tier 50 (≈ +400% raw, but diminishing via curve) |
| Bounce | 80 | +1.5% bounciness retention | Tier 50 |
| Aero | 80 | -1.2% drag coefficient | Tier 40 |
| Combo Window | 120 | +0.05 s window | Tier 30 |
| Magnet Radius | 60 | +0.1 m radius | Tier 50 |
| Crit Chance | 150 | +0.5% crit on first bounce | Tier 25 |

### Worked example (Power)
- Tier 1 cost: 100 coins.
- Tier 10 cost: 100 * 1.18^9 ≈ 459 coins.
- Tier 25 cost: 100 * 1.18^24 ≈ 6,170 coins.
- Tier 50 cost: 100 * 1.18^49 ≈ 412,000 coins.

Late-game players will spend ~30 min to fund a tier-50 power upgrade. The progression is **front-loaded for joy, back-loaded for whales/prestige**.

## 5. Launcher Tier Unlocks

| Launcher | Cost | Level Req | Effect |
|---|---|---|---|
| Wooden | Free | 1 | Baseline |
| Reinforced | 1,500 coins | 5 | +20% power, -0.2 s reload |
| Mechanical | 12,000 coins | 12 | +50% power, -0.4 s reload |
| Pneumatic | 80,000 coins | 25 | +85% power, +1 boost token |
| Military | 350,000 coins | 40 | +125% power, ±0.5° accuracy |
| Plasma | 1,200,000 coins or 1,000 gems | 60 | +175% power, 5% double launch |

## 6. Prestige

Available at Level 45 + Launcher Tier 4.

**The deal:** reset Level, Upgrades, Coins → keep Cosmetics, Launchers, BP progress, gain `+5%` permanent multiplier per prestige and a unique badge.

| Prestige | Multiplier Total | New Vanity |
|---|---|---|
| 1 | +5% | Bronze halo on launcher |
| 5 | +25% | Animated trail "Phoenix" |
| 10 | +50% | New launcher color scheme |
| 25 | +125% | Title "Ascended Slinger" |
| 50 | +250% | Ultimate skin set |
| 100 | +500% | Hall of Fame leaderboard |

Re-unlocking everything after prestige takes ~3 hours of focused play (validated through telemetry simulation).

## 7. Daily Reward Calendar

7-day cycle, escalating, *forgiving* (no streak reset on a single miss; grace period 36 h):

| Day | Reward |
|---|---|
| 1 | 200 coins |
| 2 | Common crate |
| 3 | 50 gems |
| 4 | 500 coins |
| 5 | Rare crate |
| 6 | 100 gems |
| 7 | Epic crate + 200 BP XP |

## 8. Missions

- **Daily (3 per day)**: e.g., "Travel 3 km", "Bounce 50 times", "Use boost 10 times".
- **Weekly (5 per week)**: bigger targets, big BP XP rewards.
- **Seasonal (10 per season)**: tied to BP tiers; thematic.
- Difficulty scales with player level via a multiplier `1 + level * 0.05`, capped at x3.

## 9. Achievements

20 launch-day achievements + 5 added per major update. Examples:
- "Fledgling": Travel 1,000 m. Reward: 100 gems + trail.
- "Combo Maniac": Reach 50 combo. Reward: badge.
- "Globetrotter": Visit all biomes. Reward: launcher skin.
- "Centurion": 100 prestiges (very long-term whale carrot).

## 10. Balancing Heuristics

| Heuristic | Number |
|---|---|
| Avg coins/run (F2P, level 10) | 350 |
| Time to next perceived upgrade | ≤ 8 min |
| Sessions to unlock next biome | 6–10 |
| Time to first prestige (avid player) | ~40 hours |
| Diminishing returns kicks in at upgrade tier | 25 |

## 11. Telemetry Hooks

- `progression_levelup` (level, source_xp_event)
- `upgrade_purchased` (branch, tier, price, currency)
- `prestige_triggered` (prestige_count, time_since_last_prestige)
- `mission_completed` (mission_id, time_to_complete)
- `bp_tier_reached` (season_id, tier, paid)

Used to keep the curves honest — every 2 weeks the balance team reviews drop-off & adjusts via remote config.
