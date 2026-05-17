# 13 — Sound Design Guide

## Audio Pillars

1. **Physical first.** Every visible interaction has a diegetic sound.
2. **Layered impacts.** 3 layers per collision: thud (low), texture (mid), sparkle (high).
3. **Dynamic, never static.** Music intensifies with combo; ambience responds to phase.
4. **Comedy on the edges.** Comedic punctuation on death / failure to lighten frustration.
5. **Mobile mix conscious.** Designed to sit on a 0.5 W mono phone speaker and still feel epic with headphones.

## Mix Bus Map

```
Master
├── Music
│   ├── Music_Stem_Drone
│   ├── Music_Stem_Drums
│   ├── Music_Stem_Hook
│   └── Music_Stem_Triumph
├── SFX
│   ├── SFX_Launcher
│   ├── SFX_Projectile
│   ├── SFX_Impact
│   ├── SFX_Environment
│   ├── SFX_UI
│   └── SFX_Vox      (mascot/comedy)
└── Ambience
    └── Amb_<Biome>
```

Snapshots:
- `Snapshot_Normal` — default.
- `Snapshot_SlowMo` — pitch down 0.85, low-pass at 1.2 kHz, music ducked -6 dB.
- `Snapshot_Pause` — music ducked -12 dB, SFX off.
- `Snapshot_EndRun` — music swap to triumph stem.

## SFX Catalog (excerpt)

### Launcher
- `SFX_Launcher_Draw_Wood_01.wav` — wood creak, stretchy band.
- `SFX_Launcher_Release_Wood_01.wav` — *thwock!*.
- Variants per launcher tier (wooden, mechanical metallic crank, pneumatic hiss, plasma whoosh).

### Projectile (per object family)
- Roll loop (pitched by velocity).
- Impact: soft / medium / crit triplet.
- Ability: e.g., apple split = wet crunch; explosive barrel = thump + glass crack tail.

### Environment
- Bounce pads = boing + spring oscillation.
- Coin pickup = small "ting" + tiny harp pluck on every 10th.
- Ring pass = synth swoosh + bell tail.
- Wind zone = white-noise tail panned by speed.

### UI
- Tap, confirm, cancel, error, success — all under 0.4 s.
- Reward open = rising glissando + sparkle.

### Vox (Mascot Pip)
- "Almost there!"
- "Eternal Glory!"
- "Oof."
- "BOIIIIIING."
- Recorded warm, light reverb. Localizable but English voice acceptable for MVP.

## Dynamic Music

Each biome ships **4 stems** at the same BPM/key:
- Drone (always on)
- Drums (in from multiplier ≥ x2)
- Hook (in from multiplier ≥ x4)
- Triumph (in from multiplier ≥ x6 or on end-run with PB)

Crossfade time 0.6 s. Implemented via two `AudioSource`s with looping samples and a custom `DynamicMusic.cs` mixer. No FMOD for MVP (keeps APK size small); evaluation for FMOD in live ops phase 2.

## Doppler

`AudioSource.dopplerLevel = 0.3` on projectile roll & on certain biome props (drones, vehicles). Subtle but adds a "speed" feel.

## Spatialization

- 2D stereo for projectile body & launcher.
- 2.5D spatial blend (blend 0.6) for environment objects.
- HRTF only on rare slow-mo cinematic moments (CPU cost not worth on mobile for normal play).

## Loudness & Mastering

- Target -16 LUFS short-term, -1 dBTP true peak (per Apple/Google guidelines).
- Mid/side EQ to keep music in headphones AND speakerphone.
- A/B mastered for: AirPods Pro, iPhone 11 speaker, Pixel 5 speaker, Galaxy A52 speaker.

## Audio Implementation

| Component | Role |
|---|---|
| `AudioDirector` | Owns snapshots, mixers, music. |
| `SfxPlayer` | Pool of `AudioSource`s for one-shots. |
| `DynamicMusic` | Stem mixer, BPM-locked switching. |
| `Doppler2D` | Custom 2D-doppler script for our top-down/side scrolling perspective. |

## Asset Specs

- Sample rate: 44.1 kHz.
- SFX: mono, 16-bit, ADPCM compressed in build.
- Music: stereo, 48 kHz source, Vorbis q5 in build.
- Total audio APK budget: **≤ 25 MB** at launch (remote-loaded extras via Addressables for live ops).

## Sound Test Plan

- Daily QA build runs an `AudioRegressionScene` that triggers every one-shot in sequence. CI verifies no missing clips, no overlap pops, no clipping.
- Designer review weekly on physical devices.

## Future

- Adaptive music using ML "rhythm matching" to player launches (R&D backlog).
- Localized vox lines (Spanish, Brazilian Portuguese, Japanese).
