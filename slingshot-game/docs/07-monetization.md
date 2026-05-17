# 07 — Monetization

> Philosophy: **Charge for delight, never for fairness.** Every player can complete every progression path without paying. Paying accelerates, beautifies, and supports development.

## 1. Revenue Mix Targets

| Channel | % of Net Rev (Y1 target) | Comment |
|---|---|---|
| Rewarded Video Ads | 50% | Highest fill rate, lowest annoyance. |
| Interstitial Ads | 15% | Throttled hard (see below). |
| Banner Ads | 5% | Only in non-gameplay screens. |
| Battle Pass (recurring) | 18% | Predictable, retention-driving. |
| Cosmetic IAP | 8% | Skins, trails, pets. |
| Booster IAP | 3% | Soft boosters, never auto-win. |
| Currency packs | 1% | De-emphasized in store. |

## 2. Currencies

| Currency | Earned From | Spent On | Tradable |
|---|---|---|---|
| Coins (soft) | Every run, missions | Upgrades, common crates | No |
| Gems (premium) | Battle pass, achievements, IAP | Skins, premium crates, BP unlock | No |
| Bolts (event) | Limited-time events | Event shop | No, expires |

No currency burns/decays. No artificial dual currency loops to confuse the player.

## 3. IAP Shelves

### 3.1 Cosmetic Bundles ($1.99 – $9.99)
- "Pirate Pack": pirate-themed launcher, parrot pet, treasure trail.
- Updated weekly. Featured slot rotates.

### 3.2 Battle Pass ($4.99 / season)
- 30 days. 50 tiers.
- Free track gives ~40% of total value (so non-payers feel rewarded too).
- Premium gives instant unlock of premium projectile skin + currency back over time.
- "Pass Plus" ($9.99) = pass + 25 tiers instant.

### 3.3 Boosters (soft) ($0.99 – $4.99)
- "Lucky Day": +50% coin gain for 24 h.
- "Magnetic Hour": +50% magnet radius for 1 h.
- No gameplay advantage; only acceleration.

### 3.4 Currency Packs
- Standard SKUs: $0.99 / $4.99 / $9.99 / $19.99 / $49.99 / $99.99.
- Bonus % scales 0/10/20/40/65/100.
- **Not** featured. Players who buy do so deliberately, not pressured.

### 3.5 First-Time Offers
- Triggered after first prestige and after a "PB beaten" moment (emotional high).
- Hard cap: max **2 first-time offers per week**, max 3 per lifetime.

## 4. Ads Strategy

### 4.1 Rewarded Video (RV)

| Trigger | Reward | Frequency Cap |
|---|---|---|
| "Double Coins" at run end | x2 run coins | 5/day |
| "Free Crate" daily | Common crate | 3/day |
| "Continue Run" | One-time mid-air rescue | 1 per run, 2/day |
| "Power Boost" before launch | +20% launch power | 3/day |

All RV is **player-initiated**. Never auto-play.

### 4.2 Interstitials

| Rule | Value |
|---|---|
| Min runs before first interstitial | 6 |
| Cooldown between interstitials | 4 minutes |
| Max per session | 3 |
| Never during | Tutorial, upgrade purchase, first 30 s of session |

### 4.3 Banners

- Only on Shop, Settings, Missions screens.
- Anchored bottom, height 50dp.
- Never on Run or Boot.

## 5. Battle Pass Economy

Season length: 30 days. Total premium track value (gems + skins) ≈ **$15**. Price = **$4.99**. 3x perceived value, healthy margins because most are virtual goods.

| Tier | Free | Premium |
|---|---|---|
| 1 | 50 coins | Premium skin Tier-1 |
| 5 | Common crate | Trail "Comet" |
| 10 | 200 coins | 50 gems |
| 20 | Rare crate | Premium skin Tier-2 |
| 30 | 100 gems | Pet "Bouncy" |
| 40 | Epic crate | Launcher skin "Royal" |
| 50 | Legendary projectile | 250 gems + Legendary skin |

XP sources (capped weekly to prevent grind):
- Run completion: 10 XP (50/day cap)
- Mission: 100–500 XP
- Daily login: 200 XP
- Achievement: 1000 XP

## 6. Crate System

### 6.1 Crate Types
| Crate | Source | Contents (5 drops) | Rarity Floor |
|---|---|---|---|
| Common | Run end, missions | Coins + common skin shards | — |
| Rare | Every 5th run, daily reward | Coins + rare skin | At least 1 Rare |
| Epic | Achievements | Rare/Epic skins, gems | At least 1 Epic |
| Legendary | Battle pass tier 50, IAP bundles | Epic + Legendary | At least 1 Legendary |

### 6.2 Drop Rates (Common Crate Example)
- Coins (small): 60%
- Coins (medium): 18%
- Common skin shard: 17%
- Rare skin shard: 4%
- Epic skin: 0.9%
- Legendary skin: 0.1%

### 6.3 Pity Timer
After 40 consecutive crates without an Epic+, **guaranteed** Epic on the next crate. Removes worst-case frustration without revealing the timer.

## 7. Anti-Pay-To-Win Guarantees

| Rule | Enforcement |
|---|---|
| No purchasable launch power above what F2P can earn in 14 days | Designer SO `MonetizationConstraints` validated at build. |
| Leaderboards filter by Prestige tier (paid prestige excluded from F2P boards) | Server-side. |
| No "energy" / lives | — |
| Boosters have hard time limits, not infinite | Server-validated timestamps. |
| Cosmetics never affect hitboxes | Validated by physics regression test. |

## 8. Pricing Localization

- 130+ currencies via the store.
- Tiered pricing per country bands (Apple's price band 4, 8, 16…).
- Promo prices per region for store-featured slots.

## 9. Retention-Driving Monetization

Hooks specifically designed to *retain* without aggression:
- **Battle pass progress notification** at 80% of any tier (push opt-in only).
- **Gift drops** to lapsed players (no IAP) on day 3/7/14 of inactivity.
- **Streak rewards**: 7-day login = free Rare crate, no pay required.

## 10. Compliance

- Apple ATT prompt deferred until session 3 (post-engagement) for higher opt-in.
- COPPA: if user reports under 13, ads switched to contextual only, no IDFA, no personalised content.
- GDPR: CMP (Consent Management Platform) integrated; non-consent path serves contextual ads.
- Disclosure of loot box odds (per Apple/Google/EU rules) on a "Drop Rates" page accessible from shop.
- No countdown sales on the same SKU more than 2 weeks/month (avoids deceptive scarcity).

## 11. KPIs

| KPI | Target | Alert Threshold |
|---|---|---|
| ARPDAU | $0.18 | <$0.10 |
| Ad ARPDAU | $0.10 | <$0.05 |
| IAP conversion (D7) | 3.5% | <2% |
| ARPPU | $35/mo | <$20/mo |
| % whales (>$50/mo) | 0.2% | <0.05% |
| Refund rate | <0.5% | >1% |

Every threshold breach triggers an automatic Slack alert from the analytics warehouse.
