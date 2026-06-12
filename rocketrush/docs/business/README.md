# Liftoff X — Business / Go-to-Market Docs

This folder is the B2B starter pack for offering **Liftoff X** (our Aviator-class
crash game) to casino operators and aggregators — **without** spending capital on
licensing first. The strategy is deliberately ordered: *finish the MVP → pitch →
prove the economics → talk to the market → only then make the big licensing call.*

## The four documents (suggested reading order)

| # | Doc | What it's for | Audience |
|---|---|---|---|
| 1 | **[ONE-PAGER.md](./ONE-PAGER.md)** | Email-ready single-page sell sheet. Paste in a first outreach. | Aggregator/operator BD |
| 2 | **[PITCH-DECK.md](./PITCH-DECK.md)** | 10–12 slide outline: problem → solution → differentiation → model → GTM → ask. | Operators, partners, investors |
| 3 | **[OPERATOR-ECONOMICS.md](./OPERATOR-ECONOMICS.md)** | The GGR model: adjustable assumptions, 3 rev-share scenarios, "better for operator" comparison, scaling. | Commercial / deal-making |
| 3b | **[MATH-RTP-VOLATILITY.md](./MATH-RTP-VOLATILITY.md)** | Game math sheet: RTP options, house edge, volatility, multiplier distribution, provably-fair, session metrics — all measured from the engine. | Technical due diligence |
| 4 | **[RGS-ARCHITECTURE.md](./RGS-ARCHITECTURE.md)** | How to refactor the MVP into an RGS + seamless wallet API. Tech direction to lock before building. | Engineering / integration |
| 5 | **[OUTREACH-PACK.md](./OUTREACH-PACK.md)** | Step 4 in a box: target list, email/LinkedIn templates, demo-call script + objection handling. | You, doing outreach |
| 6 | **[FUNDING.md](./FUNDING.md)** | When to raise outside money and how much each route (bootstrap / JV / own studio) costs. | You, planning capital |
| + | **[OPERATOR-CALL-QUESTIONS.md](./OPERATOR-CALL-QUESTIONS.md)** | Question list + capture sheet for the market-validation calls (step 4). | You, going into calls |

## How they fit the plan

1. **Finish the MVP** — the live demo (linked in the one-pager) is the proof.
2. **Pitch deck + one-pager** — outreach material (docs 1 & 2).
3. **Operator economics** — your strongest argument: *we grow the pie and split it
   more fairly* (doc 3).
4. **Talk to 5–10 providers/aggregators** — use the question list to turn sales
   calls into market research (doc +).
5. **Then decide** on full provider vs. license/JV — based on what the calls tell
   you, not assumptions. Doc 4 is the tech path either way.

## Important caveats

- **All numbers are illustrative models, not facts.** Replace the assumptions in
  `OPERATOR-ECONOMICS.md` with real figures as you learn them in calls.
- **Provably fair ≠ certified.** Regulated markets require certified RNG
  (GLI-19/GLI-11) on top of our provably-fair feature — see `RGS-ARCHITECTURE.md`.
- Distribution is via **aggregators**, not 5,000 direct integrations.
- Fill in / update contact + demo URL in the one-pager before sending.
