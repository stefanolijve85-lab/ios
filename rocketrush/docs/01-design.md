# 1–5 · Design, Mobile, Desktop, Design System & Component Library

> Goal: a first-time player understands the game in **3 seconds**. The screen
> answers three questions at a glance — *how high is it?*, *am I in?*, *cash out
> now?* Everything else is deliberately quieter.

---

## Visual hierarchy (the whole product in one rule)

```
LOUDEST   →  MULTIPLIER          (clamp 64–150px, center, dominates)
              ROCKET             (animated hero, drives emotion)
              CASH OUT BUTTON    (green, breathing glow, full-width thumb zone)
QUIETER   →  Bet / Auto controls (bottom, two-thumb-free steppers)
              History pills, winners, chat, header
SILENT    →  Settings, language, provably-fair badge (present, not competing)
```

If a new element ever competes with the multiplier or Cash Out button, it's wrong.

---

<a id="design-system"></a>
## Design System

### Color tokens
| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#070B14` | App background (deep space) |
| `--bg-2` | `#0B1220` | Stage / panels base |
| `--primary` | `#FF8A00` | Rocket, brand, primary CTA, "rising" |
| `--secondary` | `#9B5CF6` | Accents, high multipliers, chat names |
| `--success` | `#22C55E` | Cash Out, wins, online status |
| `--danger` | `#F43F5E` | Crash, losses |
| `--text` | `#FFFFFF` | Primary text |
| `--muted` | `rgba(255,255,255,.55)` | Secondary text |
| `--line` | `rgba(255,255,255,.08)` | Hairline borders |

**Discipline:** 1 background family + 3 functional accents. No gradients except
the two brand CTAs and the rocket trail. Glow is used sparingly as *meaning*
(it's rising / you won / it crashed), never as decoration.

### Multiplier color escalation (instant readability)
`< 2x` white · `2–5x` orange · `5–10x` purple · `≥ 10x` green. Color *is* the
information — you feel the round heating up without reading the number.

### Typography
System font stack (`-apple-system, SF Pro, Segoe UI, Inter`) — zero web-font
latency, native feel. Weights: 900 (multiplier/CTA), 800 (numbers), 700
(labels), 600 (body). All numerics use `tabular-nums` so they never jitter.

### Spacing & radius
8px base grid. Radius scale: 9–12px (controls), 16px (panels/stage), 20px
(modals), 999px (pills). Whitespace is used aggressively — panels breathe.

### Motion
- Countdown bar: linear scaleX, 100ms ticks.
- Multiplier: per-frame, no easing (it must feel *live*).
- Cash Out button: 1s "breathe" glow — draws the thumb without nagging.
- Crash: 240ms screen shake + red explosion, then settle.
- **Reduced-motion / low-bandwidth:** fewer stars, no exhaust particles, glow
  damped. Honors `prefers-reduced-motion` philosophy via the Low-Bandwidth toggle.

### Sound
Procedural WebAudio (no asset downloads): launch, tick, cash-out chime, crash
rumble. Off by one tap. Never autoplays before interaction.

---

<a id="components"></a>
## Component Library

Each maps 1:1 to a React component in the production app (`docs/02`).

| Component | Responsibility | States |
|-----------|----------------|--------|
| `<Stage/>` | Canvas: starfield, rocket, flight curve, particles | betting · running · crashed |
| `<Multiplier/>` | The hero number + status line | idle · rising · crashed |
| `<Countdown/>` | "Next round in" number + draining bar | active only in betting |
| `<ActionButton/>` | The one button that changes meaning by phase | place · cancel · cashout · queued · waiting |
| `<BetStepper/>` | − / amount / + with ½ · 2× · MAX quick-picks | enabled · insufficient-balance |
| `<AutoCashout/>` | − / 2.00x / + with OFF · 2x · 10x | off · armed |
| `<WinnersList/>` | Max 10 rows, prepend + auto-trim, "You" highlighted | — |
| `<Chat/>` | Minimal message list + input, collapsible on mobile | — |
| `<HistoryPills/>` | Horizontal scroll of last ~18 crashes, color-tiered | — |
| `<Header/>` | Logo · players online · balance · sound · settings · language | — |
| `<ProvablyFairModal/>` | Seeds, nonce, HMAC, verify last round | — |
| `<SettingsModal/>` | Sound · low-bandwidth · reality check · session limit | — |

### The single most important component: `<ActionButton/>`
There is **one** primary button, and it always says the right thing:

| Phase | Has bet? | Button | Color |
|-------|----------|--------|-------|
| betting | no | **PLACE BET** €amount | orange |
| betting | yes | **CANCEL** (€amount in) | red outline |
| running | yes, not cashed | **CASH OUT** €live-return | green, breathing |
| running | no | PLACE BET (queues next round) | muted |
| crashed | — | WAITING… / BET QUEUED | muted |

One button, zero ambiguity, full-width in the thumb zone. This is the KISS core.

---

<a id="mobile"></a>
## Mobile Design (primary target)

- **One-thumb reachability.** Cash Out spans the full width at the bottom; bet
  and auto steppers sit directly above. The whole loop is playable without
  moving your grip.
- **Layout:** header → full-bleed stage → controls. Winners and Chat become
  **bottom-tab overlays** (`🚀 Game · 🏆 Winners · 💬 Chat`) so the stage never
  shrinks below the fold.
- **Safe areas** respected via `env(safe-area-inset-*)`; works under notches and
  home indicators. `viewport-fit=cover`, no user-scaling jank.
- **60 FPS** via a single `requestAnimationFrame` canvas loop, capped DPR ≤ 2,
  and the Low-Bandwidth mode for older devices.
- **PWA:** installable, standalone, portrait, `#070B14` splash. Add-to-home-screen
  gives a native-app feel with no store friction.

<a id="desktop"></a>
## Desktop Design (secondary, same code)

A three-column CSS grid lights up at ≥ 901px — **Winners | Stage | Chat** — with
the control bar full-width beneath. Nothing is redesigned; the mobile layout
*expands* into the sidebars. Max content width 1480px so the multiplier stays
the focal point on ultrawide monitors instead of stretching thin.

---

## Anti-patterns we explicitly avoided (not Aviator)
- No dense bet-table grid, no dual-bet panels screaming for attention.
- No rainbow of stat chips. No always-on animations competing with the rocket.
- No tournaments/clans/seasons on the main screen — they're modular and live
  elsewhere (see roadmap). The main screen stays a 3-second read.
