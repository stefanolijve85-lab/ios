# LIFTOFF X — audio prompts

Theme: a rocket on the pad, engines lighting, climbing through the atmosphere
toward space — EJECT before she blows up. Cinematic sci-fi: deep sub-bass engine
rumble, synths, mission-control tension, ember/fire energy (orange accent).
High-stakes, "to the moon" euphoria vs. a fiery explosion.

Drop the rendered files in `public/themes/liftoffx/audio/` with these names.
All music/ambience must be **seamless loops** (no intro/outro). Mono is fine.
(Until these land, LIFTOFF X falls back to the BANKHEIST X audio set.)

---

## 🎵 MUSIC (Suno / Udio / MusicGen)

> ⚠️ `motif-low` and `motif-high` are two LAYERS of the same piece — the engine
> cross-fades between them as the multiplier climbs. Render both at the **same
> key, BPM and bar length** so they stack perfectly. Suggested: **C minor, 8 bars**.

**`motif-low.mp3`** — calm/tension base layer (~100 BPM)
> Tense cinematic sci-fi underscore, slow-burning launch-pad build. Deep
> sub-bass engine rumble, low pulsing synth drone, sparse ticking sequencer,
> distant mission-control radio hiss, a single brooding minor pad. Dark,
> anticipatory, "T-minus and counting." C minor, ~100 BPM, patient and spacious.
> Seamless loop, no intro, no outro, no vocals.

**`motif-high.mp3`** — intense overlay layer (same key/BPM/length)
> High-tension sci-fi action overlay that STACKS on the base drone. Roaring
> rocket-engine bass, driving arpeggiated synths, urgent pulsing percussion,
> screaming high leads, rising G-force pressure — full-thrust ascent on the edge
> of disaster. C minor, ~100 BPM (double-time feel), relentless. Seamless loop,
> no vocals, designed to layer over the base.

**`lobby.mp3`** — ambience between rounds
> Calm, weightless sci-fi ambience: drifting in orbit before the next launch.
> Soft sustained synth pad, gentle shimmer, slow twinkling arpeggio, faint
> mission-control chatter and beeps far in the background. Serene but
> anticipatory — "waiting for the next launch window." Loopable, no strong
> rhythm, no vocals.

---

## 🔊 SFX (sound-design / ElevenLabs SFX)

**`stash.mp3`** — cash-out / EJECT (~0.6–1.0s)
> Short, satisfying "ejected to safety" reward sound: a sharp pneumatic eject
> punch + parachute whoosh, a quick triumphant synth flourish, and a bright
> confirming chime. Crisp, weightless, rewarding. ~0.8s.

**`crash.mp3`** — explosion / she blows up (~1.5–2.5s)
> Catastrophic rocket explosion: a deep concussive boom, ripping metal and
> fireball roar, crackling debris and a high whistling shrapnel tail, sub-bass
> drop. Bassy, dramatic, panic. ~2s.

**`tick.mp3`** — launch countdown (**exactly ~4.6s**, ends on the last hit)
> A 4.6-second accelerating mission-control countdown: rhythmic electronic beeps
> rising in tempo and pitch like a launch sequencer (or igniting engines
> spooling up), ending on a single sharp final beep + ignition thud at 4.6s.
> No music. Ends at zero.

---

## 🗣️ VOICE LINES (ElevenLabs)

**Voice:** a calm-then-urgent American mission-control / astronaut male — clipped,
radio-filtered (slight comms compression + static). Mid-deep, controlled, with an
edge of adrenaline. Wins = sharp relief/triumph. Losses = alarm, then defeat.

**`voice-win-1..5.mp3`** (you ejected with the payout)
1. "Ejected — payout secured!"
2. "Chute's open, we're clear!"
3. "Out clean, to the moon!"
4. "Punched out just in time!"
5. "Safe and weightless, partner!"

**`voice-crash-1..5.mp3`** (the rocket blew up, you lost it)
1. "She's gonna blow!"
2. "Engine failure — too late!"
3. "We've lost her!"
4. "Abort— no, no, NO!"
5. "Burned up on the way up!"

> Render 5 separate files each. Keep them short (≈1–2s), punchy, slightly
> compressed/loud (radio-comms feel) so they cut through the music bed.
