# 01 — Game Design Document

## 1. Vision Statement

> *"Pull. Release. Watch the world bend."*

**LAUNCHED!** is a physics slingshot game where every launch is a 30-to-90 second rollercoaster of bounces, ricochets, explosions and crit zones. The fantasy is the moment of release — a satisfying *thwock!*, a screen-wide camera punch, then a 2x → 4x → 12x multiplier ladder that turns a 50 m flop into a 4,000 m mega-run. Players upgrade their launcher and projectile arsenal, unlock biomes that change physics (low-gravity space, sticky farm fields), and chase weekly leaderboards.

## 2. Genre & Reference Frame

- **Primary genre:** Hybrid casual / mid-core arcade physics.
- **Reference DNA (mechanics, not aesthetic):** Burrito Bison Revenge (combo runs), Learn to Fly 3 (upgrade economy), Hill Climb Racing 2 (meta), Crossy Road (visual readability).
- **Differentiation:**
  - Hand-crafted multipliers tied to *skill timing* (mid-air boost taps), not just RNG.
  - Biomes are physical *rule modifiers*, not just skins.
  - Prestige is a real reset with a permanent multiplier, not a paywall.
  - Cosmetics are wild and absurd — giant rubber ducks, sentient watermelons.

## 3. Design Pillars

| # | Pillar | Implication |
|---|---|---|
| 1 | **Every launch feels like a firework** | Camera shake, slow-mo on first-bounce crit, freeze-frame on multiplier breakpoints. |
| 2 | **Readable chaos** | Silhouette-first art, color-coded collisions, never more than 6 active VFX systems on screen. |
| 3 | **Skill ladders, not RNG walls** | Players can always *play better* — boost timing windows shrink at higher levels, not power-creep. |
| 4 | **Meta that respects your time** | No energy. No timers > 4 hours. Daily login = 60 seconds. |
| 5 | **Failure is funny** | Comedic ragdoll, custom death lines, "Almost!" / "Eternal Glory!" tier reactions. |

## 4. Core Gameplay Loop (Detailed)

### 4.1 The Launch
1. **Aim:** Player drags backwards from a fixed slingshot anchor. A dotted arc previews **only the first 25% of the trajectory** (intentionally — mystery is fun).
2. **Power meter:** Drag length maps to launch impulse via a clamped easing curve `power = lerp(P_min, P_max, smoothstep(0, dragMax, dragLen))`.
3. **Release:** Haptic *Light Impact* + elastic "thwock" sample + 6-frame camera squash.
4. **First-bounce window:** A 0.25 s window after first contact opens — tapping inside it triggers a **Boost** (+25% velocity, +1 combo).

### 4.2 The Flight
- **Combo system:** Bounces, ramp-hits, ring-passes and boost-taps each add +1 to combo.
- **Multiplier ladder:** `multiplier = 1 + floor(combo / 4) * 0.5` (clamped at x10).
- **Mid-air abilities (one per projectile type):** explosive, glider, rocket burst, magnet pulse, etc.
- **Distance scoring:** `score = baseDistance * multiplier + bonusZones`.

### 4.3 The Landing
- Slow-motion last 0.4 s when below 8 m/s OR on a critical impact zone.
- End-of-run sequence: distance counter ticks up with rising chord progression, crate reward animation, **then** stats card. Order is critical — emotion *before* numbers.

### 4.4 Why It's Addictive
- **Variable reward (D. Eyal):** Each run's score is unpredictable but bounded — perfect IVR schedule.
- **Compulsion arc:** "One more run" because upgrades buy +3% power per tier and players see the progress bar fill in the run.
- **Symmetric loss:** Every failure earns coins (≥ 10% of the run's gross). Players never feel they wasted a launch.

## 5. Projectile Catalog

Each projectile is a `ProjectileDefinition` ScriptableObject. Key columns:

| Tier | Object | Mass (kg) | Bounce | Drag | Special Ability | Unlock |
|---|---|---|---|---|---|---|
| 1 | Tennis Ball | 0.06 | 0.85 | 0.45 | *None* (control baseline) | Start |
| 1 | Baseball | 0.15 | 0.60 | 0.32 | +5% bounce angle preservation | Lv 2 |
| 1 | Apple | 0.20 | 0.30 | 0.35 | Splits in 2 on first impact (each gives +5% coins) | Lv 4 |
| 1 | Orange | 0.18 | 0.25 | 0.30 | Sprays juice → +10% coin drops in 3 m radius | Lv 5 |
| 1 | Rock | 0.80 | 0.45 | 0.20 | Crushes destructibles for +50% destruction bonus | Lv 6 |
| 2 | Bowling Ball | 6.0 | 0.55 | 0.10 | Plows through wood obstacles without speed loss | Lv 8 |
| 2 | Watermelon | 4.5 | 0.20 | 0.28 | On crit impact, bursts into 6 mini-melons for chain combo | Lv 10 |
| 2 | Safe | 25.0 | 0.10 | 0.05 | Spawns 25–100 coins on hard impact | Lv 12 |
| 2 | Metal Cube | 8.0 | 0.05 | 0.08 | Sparks on every bounce (combo timer +50%) | Lv 14 |
| 3 | Explosive Barrel | 3.0 | 0.30 | 0.18 | Detonates at apex OR on tap; 4 m AoE knockback | Lv 16 |
| 3 | Giant Rubber Duck | 2.0 | 0.95 | 0.45 | Insane bounce, plays squeak per bounce (combo timer +1 s) | Lv 18 |
| 3 | Rocket Pug | 1.2 | 0.40 | 0.15 | Triple rocket boost: tap 3 times within 1.5 s | Lv 22 |
| 4 | Sentient Watermelon | 5.0 | 0.50 | 0.20 | Steers mid-air ±15° via tilt input | Lv 28 |
| 4 | Gravity Anvil | 50.0 | 0.05 | 0.02 | Punches through ground → +200% bounce on resurface | Lv 32 |
| 4 | Plasma Pumpkin | 0.8 | 0.70 | 0.25 | Each bounce ionizes obstacles, doubling combo gains | Lv 36 |
| 5 | Black Hole Egg | 0.05 | 0.00 | 0.10 | Pulls coins from 8 m radius | Prestige 1 |

Every projectile owns:
- **Material:** physics material (`PhysicMaterial2D` or 3D equivalent).
- **Mesh + skinned destruction shards** (Disintegrator package).
- **SFX bank:** 3 impact variants (soft/medium/crit) + roll loop.
- **VFX kit:** trail, impact burst, ability VFX.
- **Telemetry hooks:** distance, bounces, ability uses (for balance team).

## 6. Launcher Progression

| Tier | Launcher | Power | Accuracy | Reload | Stability | Visual |
|---|---|---|---|---|---|---|
| 1 | Wooden Slingshot | 1.00x | ±4° | 1.4 s | Wobbles on release | Hand-painted oak, twine band |
| 2 | Reinforced Slingshot | 1.20x | ±2.5° | 1.2 s | Rubber band | Steel-banded oak |
| 3 | Mechanical Launcher | 1.50x | ±1.5° | 1.0 s | Crank-locked | Brass gears, steampunk |
| 4 | Pneumatic Launcher | 1.85x | ±1.0° | 0.8 s | Hisses on charge | Polished chrome, pressure gauges |
| 5 | Military-Grade Launcher | 2.25x | ±0.5° | 0.7 s | Recoil compensator | Olive drab, scope |
| 6 | Plasma Catapult | 2.75x | ±0.3° | 0.5 s | Magnetic rail | Holo-projector, ion glow |

Each tier unlocks a **launch animation upgrade** (more keyframes, particle systems, distinct release SFX) and adds a passive trait (e.g., Pneumatic = +1 boost token per run, Plasma = 5% chance of double launch).

## 7. World / Biome Catalog

| # | Biome | Physics Modifier | Signature Obstacles | Weather | Mood |
|---|---|---|---|---|---|
| 1 | Backyard Suburb | Default | Trampolines, garden gnomes, lawn mowers | Sunny → light rain | Cozy, Saturday morning |
| 2 | Farm Fields | +5% friction (mud) | Hay bales, scarecrows, tractors, cow ramps | Dust storms | Golden hour |
| 3 | City Rooftops | -10% drag (wind tunnels) | Billboards, AC units, pigeons, neon ramps | Foggy nights | Vaporwave dusk |
| 4 | Construction Zones | Variable destructibility | Wrecking balls, scaffolds, dumpsters, dynamite | Sparks rain | Industrial sunset |
| 5 | Desert Canyon | Thermal updrafts (random +Y) | Cacti, tumbleweeds, sandworms, mesas | Sandstorms | Warm reds |
| 6 | Snow Mountains | Ice slides (-90% friction patches) | Yetis, igloos, ski jumps, avalanches | Blizzards | Cool blues |
| 7 | Sci-Fi Future City | Anti-grav zones (gravity flip strips) | Hover cars, drones, energy barriers | Neon rain | Cyberpunk |
| 8 | Space (Low-G) | Gravity scale 0.25 | Asteroids, satellites, black holes | Star parallax | Cosmic awe |

Each biome includes:
- **3 obstacle prefabs minimum** with destructible variants.
- **Background parallax layers** (5 depth planes).
- **Ambient SFX loop** + biome music stem.
- **Lighting profile** (URP Volume) with color grading LUT.
- **2 randomized events** (e.g., "Stampede" in farm — cows boost you forward).

## 8. Bonus Mechanics

| Mechanic | Spawn Rule | Reward |
|---|---|---|
| **Precision Rings** | 30% chance every 60 m, harder positioning with distance | +5 combo per ring, +1 mid-air boost token |
| **Mid-Air Boost Pads** | Hand-placed in biome chunks | +30% horizontal velocity, screen-wide whoosh |
| **Coin Magnet** | 5 s buff from random crate | Coins fly to projectile from 6 m |
| **Slow-Mo Crit Zone** | Triggered on first bounce in red square | 0.4 s slow-mo, x2 combo gain during |
| **Jackpot Cannon** | Rare obstacle: enter mouth to be re-launched | Reset to slingshot power x2.5, keep combo |
| **Critical Impact Zone** | Glowing red spots on obstacles | +500 coins + screen-wide red flash |
| **Launch Streak Multiplier** | 3 launches in a row past distance threshold | +25% all rewards next run |
| **Chain Lightning** | Plasma Pumpkin only | Combo gain chains through nearby obstacles |

## 9. Difficulty & Scaling

Difficulty is *implicit* — biomes get harder as the player travels further within a run. Every 250 m a "phase" advances:
- Phase 0 (0–250 m): wide ramps, lots of bounce pads.
- Phase 1 (250–600 m): obstacles get denser, gaps appear.
- Phase 2 (600–1200 m): hazards introduced (spike pits, anti-grav wells).
- Phase 3 (1200–2500 m): bosses (Wrecking Ball Hydra, Tornado Wall).
- Phase 4+ (2500 m+): infinite procedural mix; rewards scale linearly while ramp density logarithmically.

This means **every** session, even with a wooden slingshot, the first 30 seconds feel triumphant.

## 10. Failure & End-Run Flow

1. Projectile stops (velocity < 0.5 m/s for 0.4 s).
2. **Camera glide** to projectile, mock-cinematic angle.
3. Comedy reaction (10% chance: a chicken walks up and pecks it).
4. Distance/combo/coins fly in with elastic numbers.
5. **"Almost there!"** tier line based on % of player's PB.
6. Crate reward (every run drops a Common, every 5th a Rare).
7. Big **LAUNCH AGAIN** button — primed for the next dopamine hit.

Total end-run time budget: **≤ 7 seconds** before player can launch again. Anything longer kills the loop.

## 11. Meta Progression Summary

- **Player Level (XP):** Soft cap at 100, then prestige.
- **Upgrade Tree:** Power, Bounce, Aero, Combo Window, Coin Magnet Radius, Crit Chance.
- **Catalog:** Projectile unlocks tied to level; Launcher tiers tied to gold spend.
- **Battle Pass:** 30-day seasons, free + premium tracks, 50 tiers.
- **Prestige:** Reset levels + gold for a permanent **+5% multiplier per prestige** and exclusive cosmetic per tier.

(See [docs/08-progression-system.md](08-progression-system.md) for full curves.)

## 12. Cosmetics & Personalisation

| Slot | Examples | Source |
|---|---|---|
| Projectile Skin | Disco Watermelon, Astronaut Duck | Battle pass, crates, IAP bundles |
| Launcher Skin | Dragon-bone slingshot, RGB plasma | Same |
| Trail | Rainbow, Lightning, Pixel Smoke | Mostly battle pass |
| Impact FX | Confetti, Donut shower, Crystal shatter | Premium battle pass |
| Slingshot Pet | Mini-dragon on the rim that flaps | Special events |

Cosmetics are **purely visual** — design rule: never gate a stat on cosmetics. Trust comes from this.

## 13. Tutorial / FTUE

- **0–10 s:** Big finger animation on the slingshot. Player must drag. The biome behind is pre-stocked with bounce pads → guaranteed satisfying first run.
- **10–60 s:** Three forced runs each unlocking one mechanic (boost tap, precision ring, projectile swap).
- **60–120 s:** Auto-collect first crate. First upgrade purchased for free.
- **2–5 min:** Soft tutorial overlays during normal play (translucent fingers, never modal).

## 14. Out-of-Scope (MVP)

- No multiplayer in MVP. PvP async leaderboards only.
- No UGC, no level editor.
- No console/PC ports.
- No "energy" or "lives" system, ever.

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Physics non-determinism across devices breaks leaderboards | Use fixed timestep 0.0166, deterministic Box2D fork, only score-by-distance (no replay sync). |
| "Just one more run" fails if loop is > 7 s end-to-end | Telemetry on `EndRunDuration`, gate-keep merges. |
| Whales bored by low ceiling | Prestige tree has 100+ tiers with vanity rewards. |
| Hyper-casual CPI > LTV | Onboarding A/B tests, playable ads use first 15 s gameplay verbatim. |
