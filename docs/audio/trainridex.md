# TRAINRIDE X — audio prompts

Theme: a runaway steam train racing toward a broken bridge. Western / steampunk,
warm brass + strings, locomotive rhythm, danger of derailment. Tense, cinematic.

Drop the rendered files in `public/themes/trainridex/audio/` with these names.
All music/ambience must be **seamless loops** (no intro/outro). Mono is fine.

---

## 🎵 MUSIC (Suno / Udio / MusicGen)

> ⚠️ `motif-low` and `motif-high` are two LAYERS of the same piece — the engine
> cross-fades between them as the multiplier climbs. Render both at the **same
> key, BPM and bar length** so they stack perfectly. Suggested: **A minor, 8 bars**.

**`motif-low.mp3`** — calm/tension base layer (~95 BPM)
> Tense cinematic Western underscore, slow-burning locomotive groove. Steady
> chugging steam-train rhythm (low percussion mimicking pistons and wheels on
> rails), deep cello drones, distant tremolo strings, soft low brass swells.
> Dark, brooding, "something's coming." A minor, ~95 BPM, sparse and patient.
> Seamless loop, no intro, no outro, no vocals.

**`motif-high.mp3`** — intense overlay layer (same key/BPM/length)
> High-tension Western action overlay that STACKS on the base groove. Driving,
> accelerating piston percussion, urgent staccato strings, screaming high brass
> stabs, clattering metal, rising dread — runaway-train energy on the edge of
> disaster. A minor, ~95 BPM (double-time feel), relentless. Seamless loop, no
> vocals, designed to layer over the base.

**`lobby.mp3`** — ambience between rounds
> Calm warm Western ambience: a frontier train station at dusk. Soft sustained
> pad, distant steam hiss, a lone harmonica/whistle melody, faint station crowd
> murmur, slow tremolo guitar. Relaxed but anticipatory — "waiting for the next
> train." Loopable, no strong rhythm, no vocals.

---

## 🔊 SFX (sound-design / ElevenLabs SFX)

**`stash.mp3`** — cash-out / SECURE (~0.6–1.0s)
> Short, satisfying "secured" reward sound: a bright metallic coin + latch clink,
> a quick triumphant brass/guitar flourish, and a soft whoosh of leaping clear of
> the train. Warm, crisp, rewarding. ~0.8s.

**`crash.mp3`** — derailment (~1.5–2.5s)
> Catastrophic steam-train derailment: screeching metal wheels on rails, snapping
> wood of a collapsing trestle bridge, a heavy locomotive impact and boiler
> explosion, scattering debris, and a final steam-whistle wail cut short. Bassy,
> dramatic, panic. ~2s.

**`tick.mp3`** — betting countdown (**exactly ~4.6s**, ends on the last hit)
> A 4.6-second accelerating mechanical countdown: rhythmic wheel-clack / ticking
> like a train building speed (or a lit fuse), rising in tempo and pitch, ending
> on a single sharp final clack + short whistle at 4.6s. No music. Ends at zero.

---

## 🗣️ VOICE LINES (ElevenLabs)

**Voice:** a gritty, weathered American Old-West male — a train robber / outlaw
conductor. Mid-deep, urgent, gravelly. Dry, close-mic, minimal reverb.
Wins = breathless triumph/relief. Losses = panic, then defeat.

**`voice-win-1..5.mp3`** (you jumped off with the loot)
1. "Off the train — loot secured!"
2. "Jumped just in time!"
3. "Gold's mine, train's theirs!"
4. "Clean getaway, partner!"
5. "Safe on solid ground!"

**`voice-crash-1..5.mp3`** (the train derailed, you lost it)
1. "She's going off the rails!"
2. "Bridge is out — too late!"
3. "We're derailing!"
4. "Hold on—  no, no, NO!"
5. "Lost it all on the tracks!"

> Render 5 separate files each. Keep them short (≈1–2s), punchy, slightly
> compressed/loud so they cut through the music bed.
