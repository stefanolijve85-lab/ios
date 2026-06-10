# Liftoff X — Master Plan & Checklist

> Single source of truth for "where are we and what's next" on the road to getting
> Liftoff X live with as many aggregators / casino operators as possible, while
> meeting their requirements. Tick boxes as you go. Detail for each phase lives in
> the other `docs/business/` files (linked).
>
> **Status legend:** ✅ done · 🔄 in progress · ⬜ not started

---

## Where we are right now
- ✅ **Phase 0 (MVP) and Phase 1 (sales kit) are essentially DONE.**
- 👉 **You are at the start of Phase 2: outreach** — talking to aggregators/operators
  to validate fit, terms and the exact certification/wallet requirements.
- The big capital decision (own provider vs JV/license) comes in **Phase 4**,
  *after* the outreach gives you real answers.

---

## Phase 0 — Product (the demo) ✅ DONE
- [x] Playable MVP (crash game, dual bets, auto-cashout, provably fair)
- [x] Real multiplayer (server-authoritative shared rounds)
- [x] Social/retention layer (leaderboard, activity feed, profiles, chat)
- [x] Live on a branded domain — **https://www.liftoffx.com** (HTTPS)
- [x] Visual polish (rocket artwork, flame, crash, countdown voice + radio FX)
- [x] Bug-fixes (auto-cashout edge case, etc.)
- [ ] *Optional:* final demo-ready QA pass before heavy sharing
- [ ] *Optional:* upgrade Render to a paid plan so the demo never cold-starts
      (~50 s wake-up) when you share it widely

## Phase 1 — Sales kit (so a meeting can happen) ✅ DONE
- [x] One-pager / sell sheet — [`ONE-PAGER.md`](./ONE-PAGER.md)
- [x] Pitch deck outline — [`PITCH-DECK.md`](./PITCH-DECK.md)
- [x] Operator economics model — [`OPERATOR-ECONOMICS.md`](./OPERATOR-ECONOMICS.md)
- [x] Math / RTP / volatility sheet — [`MATH-RTP-VOLATILITY.md`](./MATH-RTP-VOLATILITY.md)
- [x] RGS + wallet architecture — [`RGS-ARCHITECTURE.md`](./RGS-ARCHITECTURE.md)
- [x] Outreach pack + call questions — [`OUTREACH-PACK.md`](./OUTREACH-PACK.md), [`OPERATOR-CALL-QUESTIONS.md`](./OPERATOR-CALL-QUESTIONS.md)
- [ ] Export the one-pager + deck to **PDF** for sending
- [ ] Fill the deck's blanks (team slide, the "ask", a dated timeline)

## Phase 2 — Validate the market (THE CURRENT STEP) 🔄
*Goal: turn 5–10 conversations into real answers. Costs time, not capital.*
- [ ] Pick your **first 8–10 targets** from the tiered list in `OUTREACH-PACK.md`
      (distribution programs → aggregators → direct operators)
- [ ] Find the right contact per target (LinkedIn / "become a partner" form)
- [ ] Send outreach (email + LinkedIn) using the templates
- [ ] Hold **5–10 calls**; log each in the capture sheet (`OPERATOR-CALL-QUESTIONS.md`)
- [ ] Capture the answers that unblock everything else:
  - [ ] Market-standard **rev-share** for crash content
  - [ ] **Aggregator cut** (% of our share / markup)
  - [ ] Required **certifications** (GLI / iTech) per target market
  - [ ] Required **wallet API** flavour (seamless / single wallet)
  - [ ] Required **supplier licence(s)** (MGA / Curaçao / Anjouan / …)
  - [ ] Best **markets** for crash games + real **avg stake / rounds** numbers
- [ ] Update `OPERATOR-ECONOMICS.md` assumptions with the real numbers

## Phase 3 — Make it integration-ready (tech) ⬜
*Start the cheap parts in parallel with Phase 2; finish once calls confirm specs.*
- [ ] Split the game core into a standalone **RGS** (Remote Game Server)
- [ ] Implement a **seamless wallet API** adapter (operator holds the balance)
- [ ] Make **RTP / bet-limits / max-win** configurable per operator
- [ ] Move shared state to **Redis** (multi-node, scale)
- [ ] **Audit log** of every round + **daily reconciliation** export
- [ ] Harden: request signing, idempotency, rate limits, anti-collusion
- [ ] Responsible-gaming hooks, multi-currency, reporting
*(All steps detailed in `RGS-ARCHITECTURE.md` §7.)*

## Phase 4 — The big decision ⬜
*Made on the evidence from Phase 2 — not on assumptions.*
- [ ] Decide the route:
  - [ ] **A — Own studio:** get your own B2B supplier licence + certification
        (slow, capital-heavy, full control), **or**
  - [ ] **B — JV / license to an already-licensed studio / distribution program**
        (faster, cheaper, shared upside) — e.g. Relax "Powered By", Yggdrasil YG Masters
- [ ] Budget + timeline for the chosen route

## Phase 5 — Certify & license ⬜
*The long pole (6–18 months, capital-intensive). Only after Phase 4.*
- [ ] **Independent RNG certification** (GLI-19 / GLI-11 or iTech) for target markets
- [ ] **B2B supplier licence(s)** for the chosen jurisdiction(s)
- [ ] Data-protection / compliance sign-off
> ⚠️ Until this is done, Liftoff X is **provably fair but not certified/licensed** —
> never claim otherwise (see the disclaimer in `MATH-RTP-VOLATILITY.md`).

## Phase 6 — Distribute & go live ⬜
- [ ] Implement **one aggregator's** wallet/GAP spec first (e.g. Hub88 / SoftSwiss)
- [ ] Get **listed** on 2–3 aggregators → reach to thousands of operators
- [ ] First operators live; monitor GGR / reconciliation
- [ ] Then: white-label skins, branded tournaments/jackpots across operators

---

## The one-line summary
**Done:** product + sales kit. **Now:** talk to 8–10 aggregators/operators and
write down what they require. **Then:** build the RGS/wallet, decide own-vs-JV, and
only then spend on certification + licensing. Distribution is via aggregators, not
5,000 direct deals.
