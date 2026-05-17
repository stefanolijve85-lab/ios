# 09 — Upgrade & Economy Formulas

A monetized progression game lives or dies by its math. Every formula here is **closed-form** (no iterative simulation) so designers can tweak in spreadsheets and remote-config them on the fly.

## 1. Notation

| Symbol | Meaning |
|---|---|
| `L` | Player level |
| `t` | Upgrade tier within a branch |
| `P` | Prestige count |
| `d` | Distance achieved (m) |
| `c` | Combo count |
| `m` | Multiplier |
| `B` | Bonus zones triggered |
| `Cb` | Crate base price (coins) |

## 2. Run Score

```
score(d, m, B)  = d * m + B
coinsEarned(d, m, B) = round( (d * m * 0.08 + B * 0.5) * prestigeMult(P) * eventMult )
```

- `0.08` = base "coins per (m × multiplier)" — tuned via playtest.
- `prestigeMult(P) = 1 + 0.05 * P` (capped at +500% at P100).
- `eventMult` from active boosters / live events.

### Worked
A run of `d=2,500 m`, peak combo 22 → `m = 1 + floor(22/4)*0.5 = 3.5`, `B = 400`, `P=4` (1.2x).
```
coins = (2500 * 3.5 * 0.08 + 400 * 0.5) * 1.2 = (700 + 200) * 1.2 = 1,080
```

## 3. Multiplier

```
m(c) = clamp(1 + floor(c / 4) * 0.5, 1, 10)
```

Notable steps:
| c | m |
|---|---|
| 0 | 1.0 |
| 4 | 1.5 |
| 12 | 2.5 |
| 24 | 4.0 |
| 60 | 8.5 |
| ≥72 | 10.0 |

## 4. Upgrade Costs

Per branch `b`, tier `t` (1-indexed):
```
cost_b(t) = baseCost_b * 1.18^(t-1)
```

Spreadsheet generator (pseudo):
```
for t in 1..50:
    print( round(baseCost * 1.18^(t-1)) )
```

### Worked (Power, baseCost 100)
| t | cost | cumulative |
|---|---|---|
| 1 | 100 | 100 |
| 5 | 194 | 720 |
| 10 | 459 | 2,000 |
| 20 | 2,396 | 13,500 |
| 30 | 12,506 | 73,500 |
| 50 | 412,000 | 2,750,000 |

A player earning ~350 coins/run reaches Power t10 in ~6 runs after gating, t30 in ~210 runs. We *want* tier 30 to take ~1 week to keep the meta loop spicy.

## 5. Upgrade Effect Curves

Each tier adds a *flat* % bonus, but stacked multiplicatively across branches to avoid runaway:

```
effectivePower = basePower * Π(1 + 0.03 * t_branch)
```

Diminishing returns is implemented via **soft cap**:
```
diminishedFactor(x, cap) = cap * (1 - exp(-x / cap))
```

So `+400%` raw power becomes `+250%` effective once over the cap. We surface a "diminishing returns" warning in UI past the cap.

## 6. Coin Sources

| Source | Formula |
|---|---|
| Run (see above) | `coinsEarned` |
| Coin pickups (in-flight) | `pickupCoin(d) = round(5 + d / 200)` |
| Crate (Common) | range 50–250 |
| Mission complete | 100 / 250 / 500 (daily / weekly / seasonal) |
| Daily reward | 200 / 500 over the week |
| Achievement | 100 → 5,000 |

## 7. XP Curve

```
xpForLevel(n) = round(100 * n^1.45)
totalXpAtLevel(n) = sum(xpForLevel(i) for i in 1..n)
```

Approx total XP at level 100 ≈ **3.4M**. With XP throttles, that's ~300 hours — pacing whales.

## 8. Battle Pass XP

XP sources are *capped daily*. The cap formula:
```
dailyXpCap = 1,500 + 50 * playerLevel    // capped at 4,000
```

This prevents whales from skipping the season in one weekend, *and* prevents grinders from feeling forced. Designed for ~45 min/day to complete the BP in 28 days (leaves 2 days of safety net).

## 9. Crate Drop Rate Function

Each crate slot rolls independently. For slot probabilities `p_i`:
```
roll() = cumulative-binary-search(p_i, rng())
```

`p_i` sums to 1.0. Pity timer:
```
if streakWithoutEpic >= 40:
    force slot rarity >= Epic
    streakWithoutEpic = 0
```

## 10. Difficulty Scaling Within A Run

Phase index = `floor(distance / 250)`. Obstacle density per phase:
```
density(phase) = baseDensity * (1 + 0.18 * phase)   // capped at 3x
hazardChance(phase) = clamp(0.02 + phase * 0.04, 0, 0.45)
```

Reward density also scales (we *increase* coin pickups with phase so deeper runs feel disproportionately rich):
```
rewardDensity(phase) = baseReward * (1 + 0.25 * phase)
```

This way the *risk/reward ratio* stays positive — late runs are juicy.

## 11. Prestige Reset

When player triggers prestige at level ≥ 45:
- Level → 1
- Upgrade tiers → 0 (all branches)
- Coins → 0
- Active gems & cosmetics → preserved
- BP progress → preserved
- `prestigeCount` += 1
- Permanent `prestigeMult` updated

Time-to-first-prestige median ≈ **18 hours**, designed as a soft "you completed the game" moment.

## 12. Ad Reward Sizing

Rewarded video reward magnitudes are sized so that **opt-in is +20–30% session value**, not core dependency:

| RV slot | Reward formula |
|---|---|
| Double run coins | `coinsEarned * 2` (so total = 1x + 1x bonus) |
| Free crate | Common crate (avg coin value 150) |
| Continue run | 1 mid-air rescue token; consumed once |
| Pre-launch boost | +20% launch power for this launch only |

Telemetry tracks RV CTR by trigger; <8% = re-design the placement.

## 13. Event Multipliers

Live ops events override or compose with base values:
- "Double Coin Weekend": `eventMult = 2`.
- "Triple BP XP": BP XP source values * 3 (but cap unchanged → no exploit).
- "Mega Magnet": magnet radius * 2 globally.

All driven by Remote Config keys with schema validation.

## 14. Soft Whale Ceiling

We *deliberately* limit how much paying changes the game's *power*:
```
maxPaidPowerBoostPct = 25   // hard cap on summed paid bonuses
```

Whales spend on cosmetics, vanity prestige badges, and convenience (skips, BP). This protects the game's competitive integrity AND maintains positive press / community sentiment, which is critical for long-term LTV.

## 15. Balancing Test Harness

We ship a Unity Editor tool, `BalanceSimulator.cs`, that runs **10,000 simulated player journeys** with:
- Random skill distribution (normal, μ=median player skill).
- Daily play time distribution.
- Spend distribution (95% free, 4% minnow, 1% whale).

Outputs Time-To-Milestone histograms per balance constant. Used to validate any change to the formulas above before going to live ops.
