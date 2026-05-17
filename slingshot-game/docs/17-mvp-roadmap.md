# 17 — MVP Roadmap (16-week production plan)

## Team (lean — 7 FTE)

| Role | Headcount | Responsibility |
|---|---|---|
| Tech Director | 1 | Architecture, code reviews, performance. |
| Gameplay Engineer | 2 | Run controller, physics, combo, world streamer. |
| UI/Tools Engineer | 1 | Meta UI, editor tools, save/cloud, ads. |
| Game Designer | 1 | Balance, missions, BP, monetization. |
| 2D/3D Artist | 1 | Hero assets, biome props, animations. |
| Audio Designer | 0.5 contract | SFX, dynamic music. |
| Producer / QA | 1 | Roadmap, QA matrix, store submission. |

## Milestones

```
W1-2  Pre-prod  ─┐
W3-6  Vertical Slice ─┐
W7-10 Production Alpha ─┐
W11-13 Beta ─┐
W14    Soft Launch ─┐
W15-16 Iterate, Global Launch
```

## Week-by-Week

### Week 1 — Kick-off & Tooling
- Repo + asmdef scaffolding + CI green.
- Bootstrapper, ServiceLocator, EventBus, Save scaffold.
- Art bible + audio bible draft.
- Concept thumbnails for 3 biomes.

### Week 2 — Pre-Production
- ProjectileDefinition + LauncherDefinition data shape locked.
- Custom Editor inspectors for tuning.
- Designer creates first 5 projectile data assets.
- Whitebox launcher rig.

### Week 3 — Vertical Slice begins
- Drag-aim, launch impulse, physics step.
- One biome (Backyard) whiteboxed with 3 obstacle types.
- Basic camera follow.
- HUD with combo + distance.

### Week 4
- Combo + multiplier ladder live.
- End-of-run flow w/ stat card.
- Save service writes/reads.
- One projectile fully art-passed (Apple).
- Slow-mo system functional.

### Week 5
- Object pooling for projectiles & shards.
- 3 more projectiles: Tennis, Baseball, Bowling.
- Audio first-pass (launcher, impact, music stems).
- VFX: hit puff, combo pop, screen flash.

### Week 6 — Vertical Slice Review
- Internal demo: 90 seconds of "real" gameplay.
- KPI gate: time-to-fun ≤ 10 s, "one more run" feedback from 80% of testers.
- Cut/keep decisions on stretch features.

### Week 7 — Production Begins
- Biome 2 (Farm) whitebox + art pass.
- Boss prototype (Wrecking Ball Hydra).
- Upgrade tree screen + economy hookup.
- Mission service v1.

### Week 8
- Shop screen + IAP wiring (sandbox).
- Crate service + drop logic.
- Battle pass scaffold (no premium SKU yet).
- Localization: extract all strings.

### Week 9
- Daily reward + push notifications.
- Cosmetics equip screen.
- Achievements service.
- Biome 3 (Rooftops) whitebox.

### Week 10 — Alpha
- 4 biomes total playable end-to-end.
- 8 projectiles, 3 launcher tiers.
- All economy loops closed.
- Performance pass: hit 60 fps on Pixel 6a.
- KPI gate: D1 retention ≥ 35% in friends-and-family test.

### Week 11 — Beta Prep
- Polish pass: animation cleanup, VFX balance.
- Audio second pass: dynamic music, doppler, mix.
- Ads integration (LevelPlay) live.
- Closed beta build to TestFlight / Play Internal.

### Week 12
- 200-user closed beta. Live telemetry. Daily standups on funnel drop-offs.
- Bug fix sprint.
- First balance pass via Remote Config.
- Localization spot-check on top 5 languages.

### Week 13
- Open beta in 3 soft-launch countries (PH, NZ, CA).
- Validate ARPDAU, retention, crash-free.
- Day-1, Day-3 hotfixes if needed.

### Week 14 — Soft Launch
- Soft-launch in 8 countries.
- Marketing tests: 5 playable ad variants.
- Live ops calendar dry-run.
- Server scaling validated (10k DAU pretend load).

### Week 15
- Bug fix + content patch (1 new biome added).
- Whale/F2P balance pass based on real data.
- Compliance review for global launch.

### Week 16 — Global Launch
- All-store global release.
- 48-hour oncall.
- PR push + first event ("Watermelon Wednesday") live.

## Definition of Done per Feature

A feature ships when:
1. Code merged + 100% code-reviewed.
2. Unit / integration tests added (where applicable).
3. Performance budget within guardrails.
4. Designer + QA acceptance test pass.
5. Telemetry events live in staging.
6. Localization keys present.
7. Accessibility check (reduced motion, color blind).

## Risk Mitigation Schedule

| Risk | Owner | Trigger | Mitigation |
|---|---|---|---|
| 60 fps slips on low-tier | Tech Director | Profiler weekly | Reduce particles per scene; quality tier toggle. |
| Tutorial drop-off > 30% | Designer | Beta funnel | Re-storyboard FTUE; A/B onboarding. |
| IAP CTR < 1% in soft launch | Designer | Live data | Re-price + reshelve cosmetics. |
| CPI > $2.50 | Marketing | UA dashboards | Iterate playable ads. |

## Out-of-Scope for MVP

- Multiplayer / co-op
- UGC / level editor
- Cross-platform play
- Console ports
- Story mode
