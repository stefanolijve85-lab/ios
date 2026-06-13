# 🎧 STASH — Audio prompts (ElevenLabs SFX + Suno)

Design rules from the brief:
- **Adaptive gameplay audio, NOT music.** No vocals. No EDM drops.
- **One repeating electronic tension motif** that rises in **pitch + tempo** as
  the round progresses. Low/calm at launch → high/urgent near disaster.
- **At crash:** digital glitch → ~0.5s silence → reset.

> The game currently synthesizes this motif live in the browser (Web Audio).
> These prompts let you replace it with premium pre-rendered assets. Drop the
> exported files into `public/audio/` and I can wire them into the audio engine.

---

## 1) ElevenLabs — Text to Sound Effects

Settings: **Prompt influence ~0.5–0.7**, **Duration: Loop / 8–12s** where noted,
export **MP3** or **WAV**. Generate 3–4 variations of each and keep the best.

### A. The tension motif — 5 intensity stages (the core of the game)
Generate the SAME motif five times, only changing tempo/pitch/urgency. The game
cross-fades between stages as the multiplier climbs.

> **STAGE 1 — calm (round start)**
> `Minimal dark electronic tension loop, slow pulsing synth arpeggio, deep sub-bass heartbeat, sparse ticking clock, heist suspense ambience, no melody, no vocals, seamless loop, 90 BPM, low and calm, cold digital tone`

> **STAGE 2 — building**
> `Dark electronic tension loop, pulsing synth arpeggio slightly faster and higher, sub-bass pulse, subtle metallic ticks, rising suspense, no vocals, seamless loop, 110 BPM`

> **STAGE 3 — nervous**
> `Tense electronic loop, faster brighter synth arpeggio, driving sub-bass, ticking accelerating, growing anxiety heist score, no vocals, seamless loop, 130 BPM`

> **STAGE 4 — urgent**
> `Urgent electronic tension loop, fast high-pitched synth arpeggio, hard pulsing bass, rapid ticking, red-alert pressure, no vocals, seamless loop, 150 BPM`

> **STAGE 5 — critical (about to crash)**
> `Frantic high-pitched electronic alarm motif, very fast stuttering arpeggio, pounding bass, sirens creeping in, maximum panic and tension, no vocals, seamless loop, 170 BPM`

### B. Crash / heist hit
> `Sudden digital glitch crash, bit-crushed data corruption stutter, sharp alarm blast, electronic vault breach explosion, abrupt cut to silence, no musical tail, ~1 second`

### C. STASH success (lock the winnings) — the reward sound
> `Satisfying cash register lock-in, heavy metallic vault latch clunk, bright sparkling coins cascade, positive digital confirmation chime, short, rewarding, premium casino`

### D. Vault closing (betting → round start)
> `Heavy steel vault door swinging shut and sealing, mechanical bolts and locks engaging, deep metallic thud, tense anticipation, cinematic`

### E. Cash counting tick (plays as the amount rises)
> `Short crisp digital coin tick with a subtle rising pitch, fast money counter blip, clean UI sound`

### F. Thieves approaching alarm (final seconds)
> `Rising red-alert alarm siren, pulsing warning tone, distant footsteps and metal clanks approaching, heist tension, electronic`

### G. UI tap / chip select
> `Soft premium UI tap, subtle tactile digital click, expensive interface feel`

### H. Round win celebration (big multiplier stash)
> `Triumphant short cash explosion, coins and gold bars clattering, sparkling reward stinger, premium casino jackpot, no vocals`

---

## 2) Suno — optional lobby / between-rounds atmosphere

Gameplay should stay SFX-driven, but Suno is great for a **lobby / menu loop** or
low-volume **between-rounds bed**. Turn **Instrumental ON** (no vocals).

**Style prompt:**
> `dark cinematic electronic, heist noir, minimal techno, casino underworld, brooding analog synths, deep pulsing bassline, tense and hypnotic, restrained, looping background bed, instrumental`

**Exclude / negative styles:** `vocals, lyrics, EDM drop, festival, cheerful, pop, guitar`

**Variations to try:**
- *Lobby (calm, premium):*
  `slow dark ambient techno, gold-and-black casino lounge, sparse hypnotic pulse, luxurious and mysterious, instrumental, seamless loop`
- *Pre-round build:*
  `mounting electronic suspense, steady kick pulse, rising tension synths, heist countdown energy, instrumental, loopable`

> Tip: keep Suno tracks at **−12 to −18 dB** under the SFX so the adaptive
> tension motif always stays the emotional driver.

---

## 3) File drop + wiring

Suggested layout:
```
public/audio/
  motif-1.mp3 … motif-5.mp3   # tension stages
  crash.mp3
  stash.mp3
  vault-close.mp3
  tick.mp3
  alarm.mp3
  tap.mp3
  lobby.mp3                   # optional Suno bed
```
Once the files are in, the in-browser synth engine (`src/lib/audio.ts`) can be
swapped to cross-fade `motif-1…5` by multiplier and trigger the one-shots on
`round_start`, `stashed`, and `crash`. Ask and I'll wire it up.
