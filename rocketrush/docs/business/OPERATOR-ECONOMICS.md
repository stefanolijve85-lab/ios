# LiftoffX — Operator Economics

> The numbers behind "a better revenue model for the operator."
> Everything here is a **model with explicit, adjustable assumptions** — treat
> the assumptions as the things you validate in operator/aggregator calls, not as
> facts. Replace them with real figures as you learn them.

---

## 1. How the money works (crash game)

```
Turnover (total wagered)
   └─ × house edge (1 − RTP)  ──►  GGR  (Gross Gaming Revenue = operator's gross win)
                                     ├─ provider share (our revenue)  = rev-share % × GGR
                                     ├─ aggregator cut (if via aggregator)
                                     └─ operator keeps the rest  (before their own costs:
                                        payments, platform, bonuses, marketing, tax)
```

- **GGR is the pie.** Both we and the operator are paid out of GGR.
- Lower RTP → bigger GGR (bigger pie) but worse for the *player* → tune per market.
- Our job: take a fair slice **and** grow the pie via retention (more rounds played).

---

## 2. Base assumptions (adjustable — validate these!)

| Assumption | Base case | Notes |
|---|---|---|
| Avg stake per round | **€1.00** | crash bets are small; dual-bet lifts effective stake |
| Rounds wagered / active player / month | **1,200** | engaged players; our 2-bet design ↑ this |
| ⇒ Turnover / active player / month | **€1,200** | = stake × rounds |
| RTP versions | **97% / 96% / 95%** | = 3% / 4% / 5% house edge |
| Aggregator cut (of our share) | **0–25%** | direct = 0%; via aggregator ≈ 20–25% |

> Change one number, everything below scales linearly. Keep this table as the
> single source of truth.

---

## 3. GGR per 1,000 active players / month

Turnover per 1,000 players = 1,000 × €1,200 = **€1,200,000 / month**.

| RTP | House edge | **GGR per 1,000 players / mo** |
|---|---|---|
| 97% | 3% | €36,000 |
| 96% | 4% | €48,000 |
| 95% | 5% | €60,000 |

We'll use **RTP 96% (€48,000 GGR / 1,000 players)** as the running example below.

---

## 4. Rev-share scenarios — side by side

Three models to **test in conversations**. All shown at RTP 96%, per 1,000 active
players/month (GGR = €48,000). "Operator keeps" is **before** the operator's own
costs and any aggregator cut.

| Model | Provider rate | **Our revenue /1k/mo** | **Operator keeps /1k/mo** |
|---|---|---|---|
| **A — Operator-first (flat)** | 8% | €3,840 | €44,160 |
| **B — Standard (tiered, ~11% eff.)** | ~11% | €5,280 | €42,720 |
| **C — Premium (flat, incumbent-like)** | 15% | €7,200 | €40,800 |

### Tiered staffel (Model B) — per operator, by monthly GGR our game generates
Rewards bigger operators with a lower marginal rate (your "better at scale" hook):

| GGR tier / month | Provider rate |
|---|---|
| First €50,000 | 14% |
| €50,000 – €250,000 | 10% |
| €250,000+ | 7% |

---

## 5. The "better for the operator" headline

Versus an incumbent **15% / fixed-RTP** deal, at the **same** player base:

| Per 1,000 active players/mo | Incumbent (15%) | **LiftoffX (Model A, 8%)** | Operator gain |
|---|---|---|---|
| Operator keeps (RTP 96%) | €40,800 | €44,160 | **+€3,360 / mo** |
| Annualised | €489,600 | €529,920 | **+€40,320 / yr** |

Plus the **second lever**: our social/retention layer aims to lift *rounds per
player* (the 1,200 assumption). Even at the same rev-share, +10% rounds = +10% GGR
= more money for the operator **and** us. This is the real pitch: *we grow the
pie, not just split it cheaper.*

---

## 6. Scaling — our revenue (RTP 96%)

| Active players / mo | Model A (8%) | Model B (~11%) | Model C (15%) |
|---|---|---|---|
| 1,000 | €3,840/mo | €5,280/mo | €7,200/mo |
| 10,000 | €38,400/mo | €52,800/mo | €72,000/mo |
| 100,000 | €384,000/mo | €528,000/mo | €720,000/mo |

---

## 7. Portfolio view (the venture-scale headline)

Distribution is via aggregators reaching ~5,000 operators — but **only a fraction
go live, with very different player bases.** A deliberately *conservative* roll-up:

| Assumption | Value |
|---|---|
| Operators live | 150 |
| Avg active players / operator | 1,500 |
| ⇒ Total active players | 225,000 |
| GGR (RTP 96%, €48/player) | **€10.8M / month** |
| Our revenue @ 8% (Model A) | **€864k / mo → €10.4M / yr** |
| Our revenue @ 11% (Model B) | **€1.19M / mo → €14.3M / yr** |

> Net of a 20–25% aggregator cut on our share, knock ~⅕ off our revenue. Still a
> high-eight-figure ARR path **if** the live-operator and active-player
> assumptions hold — which is exactly what slides 4 & 8 of the deck must convince
> people of, and what the operator calls must validate.

---

## 8. What to validate in operator / aggregator calls

1. **Avg stake & rounds/player** in real money (replaces the €1 / 1,200 guesses).
2. **Market-standard rev-share** for crash content (is 8–15% the right band?).
3. **Aggregator cut** — % of our share, or markup to the operator?
4. **Required RTP versions** per target market.
5. **Required certs & wallet API** (GLI vs iTech; seamless wallet flavour).
6. **Which markets** convert best for crash games (LatAm, India, Africa, EU…).
7. Appetite for **white-label / branded** versions (premium upsell).

---

## 9. Sensitivity cheatsheet

- Revenue scales **linearly** with: active players, stake, rounds, rev-share.
- Revenue scales with **house edge** (1 − RTP): 95% RTP vs 97% RTP = **+67%** GGR.
- The two highest-leverage levers you actually control: **(a)** getting live on
  more operators (distribution), **(b)** lifting rounds/player (retention) — which
  is precisely why the social layer is a commercial feature, not a nice-to-have.
