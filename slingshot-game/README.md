# LAUNCHED! — Physics Slingshot (Working Title)

A cross-platform (iOS + Android) physics slingshot game built on **Unity 6 (LTS, URP, 2D + 3D hybrid 2.5D pipeline)**. Players drag-and-release a catapult to fling absurd objects across procedurally-extended biomes, racking up combos, multipliers and distance. Originally inspired by the *launch-and-go* sub-genre (Burrito Bison, Learn to Fly), but with a fully original meta-loop, art bible and economy.

> **Tagline:** *One pull. Infinite chaos.*

This directory contains everything a small AAA-quality mobile studio needs to ship the MVP:

| Folder | Contents |
|---|---|
| `docs/` | 19 design documents covering GDD, tech architecture, economy, art, audio, VFX, roadmap. |
| `unity-project/` | Unity 6 scripts, ScriptableObject configurations, project settings, scene blueprints. |

---

## Documents Index

| # | Document | Purpose |
|---|---|---|
| 01 | [Game Design Document](docs/01-game-design-document.md) | Pillars, fantasy, gameplay loop, objects, launchers, biomes, bonuses. |
| 02 | [Gameplay Loop](docs/02-gameplay-loop.md) | 10-second loop, 60-second loop, 7-day retention loop. |
| 03 | [Technical Architecture](docs/03-technical-architecture.md) | Layered architecture, services, event bus, addressables, save. |
| 04 | [Folder Structure](docs/04-folder-structure.md) | Asset folder layout, naming conventions, assembly definitions. |
| 05 | [Unity Scene Structure](docs/05-unity-scene-structure.md) | Boot, Meta, Run, BiomeStreamer scenes, additive loading. |
| 06 | [Physics Setup](docs/06-physics-setup.md) | Collision matrix, layers, fixed timestep, custom aero, slow-mo. |
| 07 | [Monetization](docs/07-monetization.md) | IAP shelves, rewarded ads, battle pass, ethical caps. |
| 08 | [Progression System](docs/08-progression-system.md) | XP, levels, prestige, biome unlock gates. |
| 09 | [Upgrade Formulas](docs/09-upgrade-formulas.md) | Closed-form cost/power curves with worked examples. |
| 10 | [UI Wireframes](docs/10-ui-wireframes.md) | ASCII wireframes for every screen, motion principles. |
| 11 | [Art Direction](docs/11-art-direction.md) | Style targets, color scripts, silhouette rules. |
| 12 | [Animation Direction](docs/12-animation-direction.md) | Squash/stretch budgets, easing curves, secondary motion. |
| 13 | [Sound Design](docs/13-sound-design.md) | Layered SFX, dynamic music states, mix bus map. |
| 14 | [VFX Guide](docs/14-vfx-guide.md) | Juice taxonomy, particle budgets, shader catalog. |
| 15 | [Optimization Checklist](docs/15-optimization-checklist.md) | Mid-range device targets, GPU/CPU budgets, profilers. |
| 16 | [Mobile Deployment Checklist](docs/16-mobile-deployment.md) | Store listings, signing, ATT, GDPR, COPPA. |
| 17 | [MVP Roadmap](docs/17-mvp-roadmap.md) | 16-week production plan with milestones. |
| 18 | [Live Ops Roadmap](docs/18-live-ops-roadmap.md) | First 12 months of events, seasons, balance patches. |
| 19 | [Future Expansion](docs/19-future-expansion.md) | Co-op, PvP, UGC, brand collabs, IP extensions. |

---

## Engineering Quickstart

```bash
# 1. Open unity-project/ in Unity 6 (6000.x LTS)
# 2. Required packages auto-resolve via Packages/manifest.json:
#    - com.unity.render-pipelines.universal
#    - com.unity.cinemachine
#    - com.unity.inputsystem
#    - com.unity.addressables
#    - com.unity.purchasing
#    - com.unity.mobile.notifications
#    - com.unity.localization
# 3. Open Assets/_Project/Scenes/Boot.unity and press Play.
```

Every C# file lives under `unity-project/Assets/_Project/Scripts/` with one folder per assembly definition. Read [docs/03-technical-architecture.md](docs/03-technical-architecture.md) for the high-level map.

---

## North-Star Metrics (the studio's bet)

| Metric | Target | Why |
|---|---|---|
| D1 retention | ≥ 45% | Hyper-casual quality bar; pull/release feels great in 5 seconds. |
| D7 retention | ≥ 18% | Mid-core meta (battle pass + prestige) hooks long-tail. |
| Session length | 4–7 min | 3–5 runs per session, each ≤ 90 s. |
| Sessions/day | 4+ | Daily missions, energy-free, push notifications. |
| ARPDAU | $0.18 (US) | 70% ads, 30% IAP, gentle whale ceiling. |
| Crash-free users | ≥ 99.5% | Cloud Diagnostics + Sentry. |
| Average FPS (mid-tier Android) | 60 | Pixel 6a, Galaxy A54 baseline. |
