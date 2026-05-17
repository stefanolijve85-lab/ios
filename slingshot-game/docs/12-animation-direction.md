# 12 — Animation Direction

## Animation Pillars

1. **Snap & Settle.** Quick anticipation, fast attack, lingering recovery.
2. **Follow-through everywhere.** Slingshot bands jiggle after release, projectiles squash on impact, UI elements wobble.
3. **Personality per projectile.** A rubber duck wobbles differently than a bowling ball.
4. **Anim quality scales with launcher tier.** Players see clear visual upgrades.

## The Big Animations

| Sequence | Notes |
|---|---|
| Slingshot Idle | Subtle bob 0.5 Hz, leaves sway. |
| Slingshot Draw | Bands stretch via shader (vertex displacement), 8 frames in / hold / out. |
| Slingshot Release | Snap forward, 2-frame smear, 6-frame oscillation. |
| Projectile Launch | Squash on release (1.4x x, 0.7x y), rotates with angular velocity. |
| Projectile Bounce | Squash on impact (`scale.y = 1 - hitForce*0.001`, clamped), springs back via DOTween. |
| Projectile Spin | Continuous rotation tied to angular velocity (visual gyroscope). |
| Combo Pop | Counter scale 1.0 → 1.4 → 1.0 with chromatic aberration tick. |
| End-Run Settle | Slow-mo dolly orbit, projectile rotates lazily. |
| Crate Open | Tilt > shake > pop > spray. |
| Currency Add | Numbers scale + 3 sparkles, never longer than 1.2 s. |

## Easing & Curve Library

We standardize on a small set of curves (Designers cannot invent new ones without TA approval — keeps the brand cohesive).

| Name | Use |
|---|---|
| `EaseOutBack` | Buttons, popups |
| `EaseOutCubic` | Panel slides |
| `EaseOutQuad` | Number counters |
| `EaseOutElastic` | Reward reveals (rare!) |
| `EaseInQuart` | Camera dolly during slow-mo |
| `SineEaseInOut` | Idle bobs |

## Squash & Stretch Budget

- Projectile body distorts at most ±35% from neutral.
- Bands stretch up to 250% length.
- UI buttons compress max 8%.

Excessive squash kills physical-feel; we tested at 50%/100% — players reported "too cartoony" past these caps.

## Skeletal Rigs (3D Projectiles)

- 12–28 bones max.
- All hero projectiles share a "Pet" rig variant (8 bones) for the meta-screen pet slot.

## State Machines (Animator Controllers)

Each projectile has an `Animator` with states:
- `Idle` — on hand / preview.
- `Launched` — flying loop with motion blur.
- `Impact` — single-shot trigger on collision; auto-returns to `Launched`.
- `Ability` — ability-specific (e.g., Apple `Split`).
- `Settled` — landed.

Transitions use `AnimatorOverrideController` so a single FSM template serves all projectiles (saves QA time).

## Camera Animation

- Cinemachine's `LookAhead` jitters at low velocity → we add a velocity-gated damping curve.
- On boost trigger: camera punches **forward** (z) by 0.3 over 0.12 s, then EaseOutCubic back.
- On crit: camera shake amplitude 0.4 m, frequency 18 Hz, duration 0.4 s.

## UI Animation

- Every screen entry/exit has a "build-up" — child elements stagger in by 0.04 s.
- Tab switches use a cross-slide (old goes left, new comes from right).
- Reward sequences use a forced wait of ~0.6 s before showing the **next** modal (prevents stack flicker).

## Motion Accessibility

A toggle `Settings.ReducedMotion = true` disables:
- Camera shake
- Slow-mo (gameplay time unaffected)
- UI stagger delays
- Particle "burst" intensities

Validated on simulated vestibular sensitivity playtests.

## Animation Production Workflow

1. Animator drafts an idea in Blender / Spine.
2. Tech Artist hooks it into the rig + state machine.
3. Designer wires triggers via gameplay events (e.g., `EventBus<BounceOccurred>` triggers `Impact` state).
4. QA verifies fps cost on the test device matrix.

## Performance Targets

- All animations evaluated via Unity's `Animation Streams` (Jobified) where possible.
- Total bones per frame on screen: ≤ 200 (10 visible projectiles + launcher + boss).
- Average animation CPU per frame: ≤ 0.4 ms on Pixel 6a.
