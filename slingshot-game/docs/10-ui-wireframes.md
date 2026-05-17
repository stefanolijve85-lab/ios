# 10 — UI Wireframes & UX

## Design Principles

1. **One-handed first.** All critical buttons in the lower 60% of the screen (thumb zone).
2. **Three-tap rule.** Any feature reachable in ≤ 3 taps from main menu.
3. **Juice everywhere.** Buttons squash on press, panels slide in with overshoot ease.
4. **Never modal during gameplay.** Pop-ups defer to between-run.
5. **Glanceable HUD.** Numbers > icons. Big multiplier. Diegetic distance billboard.
6. **Haptic feedback** on every meaningful tap (Light/Medium/Heavy mapped to importance).

## Screen Map

```
Boot → Main Menu ─┬─→ Run (Aim → Fly → End-Run)
                  ├─→ Upgrade
                  ├─→ Shop
                  ├─→ Missions
                  ├─→ Battle Pass
                  ├─→ Cosmetics (Equip)
                  ├─→ Leaderboards
                  └─→ Settings
```

---

## Main Menu (Portrait)

```
┌────────────────────────────────────────┐
│  ⚙️         🪙 12,450    💎 240    🎫16│  ← top bar: settings, currencies, BP
│                                        │
│       ╔═══════════════════════╗        │
│       ║                       ║        │  ← Hero stage: 3D rotating slingshot
│       ║   [Slingshot 3D]      ║        │     with current launcher + equipped
│       ║                       ║        │     projectile floating above
│       ╚═══════════════════════╝        │
│                                        │
│   Level 14   ▓▓▓▓▓▒▒▒▒▒  3,200/5,000   │  ← XP bar
│                                        │
│   ┌────────────────────────────────┐   │
│   │      🚀  LAUNCH!  🚀           │   │  ← BIG primary CTA
│   └────────────────────────────────┘   │
│                                        │
│   ┌──────────┬──────────┬──────────┐   │
│   │ Upgrade  │   Shop   │ Missions │   │  ← secondary nav
│   │   ⚡     │    🛒    │   📋     │   │
│   └──────────┴──────────┴──────────┘   │
│                                        │
│   ┌──────────┬──────────┬──────────┐   │
│   │  BP 🎫   │  Skins   │  Boards  │   │  ← tertiary
│   └──────────┴──────────┴──────────┘   │
│                                        │
│  🎁 Daily reward! (rewarded card)      │  ← popup-drawer
└────────────────────────────────────────┘
```

Motion: hero slingshot rotates idly with subtle bob (0.5 Hz), particle dust drifting upward. On `LAUNCH!` press, a one-frame white flash + camera zoom triggers Run scene load.

---

## In-Run HUD (Portrait)

```
┌────────────────────────────────────────┐
│  ⏸  PAUSE       🪙 +124 (this run)     │
│                                        │
│      ╔════════╗                        │
│      ║  x3.5  ║      DIST  812 m       │  ← Multiplier huge, distance to the
│      ╚════════╝                        │     right with comma formatting
│                                        │
│                                        │
│                                        │
│                                        │
│      [GAMEPLAY VIEW — projectile mid-air]
│                                        │
│                                        │
│                                        │
│                                        │
│                                        │
│                       ⏎ BOOST!         │  ← boost ring pulses when tap is
│                                        │     available; thumb-zone right
└────────────────────────────────────────┘
```

Multiplier scale is `1 + 0.05 * floor(m/1)` to convey "the bigger, the better". Distance uses `Burst` font + slight scroll on every 100 m boundary.

---

## End-of-Run Card

```
┌────────────────────────────────────────┐
│                                        │
│        ✨ NEW PERSONAL BEST! ✨        │
│                                        │
│            🎯 4,128 m                  │  ← Tween: 0 → 4,128 in 1.2 s
│        Previous best: 3,940 m          │
│                                        │
│    Multiplier peak       x7.5          │
│    Bounces               47            │
│    Coin pickups          83            │
│    Bonus zones           3             │
│                                        │
│    ──────────────────────────────      │
│    Coins this run        🪙 1,084      │
│                                        │
│    [📺 Watch ad → Double coins x2]      │  ← RV button
│                                        │
│    ┌──────────────────────────────┐    │
│    │       🚀  LAUNCH AGAIN       │    │  ← Primary CTA, pulses
│    └──────────────────────────────┘    │
│                                        │
│    [Upgrade] [Shop] [Exit to Menu]     │
└────────────────────────────────────────┘
```

Order rule: emotional payoff (PB animation) → numbers → reward → CTA. Anything else kills momentum.

---

## Upgrade Screen

```
┌────────────────────────────────────────┐
│ ← Back          UPGRADES        🪙12,450│
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⚡ POWER                  Tier 14  │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │ │
│ │ +42% impulse                        │ │
│ │ ┌────────────────────────────────┐ │ │
│ │ │   Upgrade  🪙 728  ← BUY        │ │ │
│ │ └────────────────────────────────┘ │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 🏀 BOUNCE                Tier 8   │ │
│ │ ▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │ │
│ │ +12% bounce retention              │ │
│ │ [Upgrade 🪙 380]                   │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 💨 AERO                  Tier 6    │ │
│ │ ...                                │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

Each row expands on tap to show next 3 tiers (transparency about the curve). Designers strongly prefer this over hidden costs — players hate surprises.

---

## Shop

```
┌────────────────────────────────────────┐
│ ← Back           SHOP         🪙12k 💎240│
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 🌟 FEATURED  ⏳ 22h 14m           │   │
│ │ "Pirate Pack" — launcher + pet + │   │
│ │  parrot trail — $9.99            │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ─────  BATTLE PASS  ─────              │
│ │ 🎫 Battle Pass — Season 1          │ │
│ │ Free + Premium tracks — $4.99      │ │
│                                        │
│ ─────  PROJECTILE SKINS  ─────         │
│ ┌────────┬────────┬────────┬────────┐ │
│ │Watermelon│Apple of│Lightning│ Disco │ │
│ │  Skull   │ Eden  │  Rock   │ Duck │ │
│ │  💎 75  │  💎 50 │  💎 90  │  💎120│ │
│ └────────┴────────┴────────┴────────┘ │
│                                        │
│ ─────  GEM PACKS  ─────                │
│ │ 💎 100  $0.99 │ 💎 550  $4.99 │      │
└────────────────────────────────────────┘
```

Aggressive featuring of cosmetics > currencies. Currency packs at the bottom.

---

## Missions

```
┌────────────────────────────────────────┐
│ ← Back        MISSIONS         🎫16    │
│                                        │
│  Daily Missions      ⏳ resets 6h 12m  │
│ ┌────────────────────────────────────┐ │
│ │ Travel 3 km             ✓ Claim    │ │
│ │ Reward: 🪙 200  🎫 50              │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Bounce 50 times          22/50     │ │
│ │ ▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    │ │
│ │ Reward: 🪙 150  🎫 50              │ │
│ └────────────────────────────────────┘ │
│                                        │
│  Weekly                                │
│ ┌────────────────────────────────────┐ │
│ │ Reach 50 km this week    18.4/50   │ │
│ │ Reward: Rare crate 🎫 500           │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Battle Pass

```
┌────────────────────────────────────────┐
│ ← Back     BATTLE PASS · S1   ⏳12 days │
│                                        │
│  Premium [⬆ Unlock $4.99]              │
│  Free                                  │
│                                        │
│ │ T05  T06  T07  T08  T09 ★T10  T11 │  ← horizontal scroll, current tier
│ │ ╳   ╳    ╳    ✓    ✓    ✓    ✓   │     centered with glow
│ │ 🪙  🎁   🎫   🪙   💎   🎁  🎫    │
│ │                                    │
│ │ ●●●●●●●●○○○○                    │  ← XP progress to next tier
│                                        │
│  This season's reward preview          │
│  [Legendary Plasma Pumpkin skin]       │
└────────────────────────────────────────┘
```

---

## Cosmetics Equip

```
┌────────────────────────────────────────┐
│ ← Back     LOADOUT                     │
│                                        │
│       ╔═══════════════════════╗        │
│       ║ [Projectile preview]   ║       │  ← rotates, hit-test to spin
│       ╚═══════════════════════╝        │
│                                        │
│  Projectile: [Disco Watermelon ▼]      │
│  Trail:      [Comet ▼]                 │
│  Impact FX:  [Confetti ▼]              │
│  Pet:        [Parrot ▼]                │
│  Launcher:   [Plasma + Royal ▼]        │
│                                        │
│  ┌────────────────────────────────┐    │
│  │           EQUIP                 │    │
│  └────────────────────────────────┘    │
└────────────────────────────────────────┘
```

---

## Leaderboards

```
┌────────────────────────────────────────┐
│ ← Back   LEADERBOARDS                  │
│ [ Global ] [ Friends ] [ Weekly ]      │
│                                        │
│  Rank   Player              Dist       │
│  ───────────────────────────────       │
│   1   👑 SkyLauncher       18,420 m   │
│   2     PumpkinKing        17,209 m   │
│   3     OrbitDuck          16,001 m   │
│  ...                                   │
│   42  YOU                   4,128 m   │  ← player highlight, sticky
│  ...                                   │
└────────────────────────────────────────┘
```

---

## Motion Catalog (Tween Specs)

| Element | Anim | Curve | Duration |
|---|---|---|---|
| Button press | Scale 1.0 → 0.95 → 1.0 | EaseOutBack | 0.18 s |
| Panel slide in | Y +200 → 0 | EaseOutCubic | 0.32 s |
| Counter increment | from → to | EaseOutQuad | 1.2 s |
| Modal popup | Scale 0.6 → 1.05 → 1.0 | EaseOutElastic | 0.45 s |
| Reward shine | Sweep | Linear | 0.6 s, loop |

Implemented via DOTween (already in `ThirdParty/`).

## Accessibility

- Text minimum 18 dp.
- Color-blind palette: red/green replaced with red/cyan in critical UI.
- Toggle for reduced motion (disables camera shake, screen flash).
- Voiceover labels on every interactive element.
- Haptic toggle.

## Localization-Aware Layout

All UI uses dynamic UI Toolkit layout with min/max widths. Hard-coded pixel widths only for icons and large buttons. Test plan: open every screen in DE, RU, JA, AR (RTL) — text must never clip.
