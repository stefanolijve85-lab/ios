# Liftoff X — Sound generation prompts (ElevenLabs + Suno)

> Generate each clip, then **save it in `public/sounds/` with the exact filename**
> below — the game preloads them on boot and uses them **automatically** (no code
> changes). Missing files fall back to the built-in synth. Commit the files and
> redeploy (everything in `public/` is served as static assets).
>
> **Format for all:** MP3, 44.1 kHz, normalised to about **−14 LUFS** (so nothing is
> ear-splitting). Keep each file small (a few hundred KB).
>
> **Which slider controls it** (Settings → Audio): **Music** = music / engine / thrust ·
> **Soundeffects** = explosion, cash-out, jackpot · **Voice** = countdown + spoken cheer.

---

## A. Suno (music & musical stings)

### 1. `music.mp3` — flight background music (LOOP)
- **Length:** 20–40 s, must **loop seamlessly** (start and end on the same beat).
- **Plays:** on the **Music** bus through the whole flight; stops at the crash.
- **Prompt:**
  > Instrumental, looping, high-energy electronic build-up for a rocket "crash" betting
  > game. Driving synth arpeggio, pulsing sub-bass, tense rising tension that feels like
  > climbing higher and higher. Futuristic, space, neon, casino-cool. No vocals, no
  > sudden drops, steady tempo ~124 BPM, seamless loop. Mood: exciting, suspenseful,
  > "anything can happen."
- **Suno tips:** set it to *Instrumental*, keep it simple/loopable, trim to a clean loop
  point in an audio editor before saving.

### 2. `jackpot.mp3` — big-win celebration sting (NO loop)
- **Length:** 3–4 s, one-shot.
- **Plays:** on the **Soundeffects** bus when you win **over €100,000** (with confetti).
- **Prompt:**
  > Short triumphant win fanfare sting for a casino game jackpot. Bright ascending brass
  > and synth chord that resolves on a big major hit, sparkly bells, a celebratory crowd
  > cheer underneath, and a quick rising siren whoop. Euphoric, "you just won big",
  > 3 seconds, ends clean. No vocals/words.
- **Note:** if you'd rather voice the cheer separately, keep this purely musical and use
  the ElevenLabs "Big win!" clip below — but the game only loads one `jackpot.mp3`, so
  bake the cheer into this file if you want both.

---

## B. ElevenLabs — Sound Effects (use the "Sound Effects" generator)

> Paste each as the SFX prompt. Generate a few takes, pick the punchiest, export MP3.

### 3. `explosion.mp3` — the crash / rocket blows up
- **Length:** ~0.8–1.3 s.
- **Plays:** on **Soundeffects** when the rocket busts.
- **Prompt:**
  > A powerful rocket explosion: sharp transient crack, deep booming sub-bass impact,
  > debris crackle and a short fiery whoosh tail. Cinematic, punchy, mono, about
  > 1 second, no music.

### 4. `engine.mp3` — rocket engine rumble (LOOP)
- **Length:** 2–4 s, **seamless loop** (steady, no build-up — it's looped continuously).
- **Plays:** on the **Music** bus during flight.
- **Prompt:**
  > A steady, continuous rocket engine rumble — deep, smooth, powerful thrust drone with
  > a low roar and subtle high hiss. Constant volume, no build-up or fade, seamless loop,
  > 3 seconds. Like standing near a launching rocket.

### 5. `thrust.mp3` — thrust-alarm bed (LOOP) — *you already have one; optional re-do*
- **Length:** 2–4 s, **seamless loop**.
- **Plays:** on the **Music** bus during flight (the "extra thrusters" layer).
- **Prompt:**
  > A tense looping thruster/alert bed for a climbing rocket: pressurised gas jet hiss,
  > a faint pulsing warning beep, growing intensity but loopable at constant level. Sci-fi
  > cockpit, urgent, 3 seconds, seamless loop, no music.

### 6. `cashout.mp3` — you cash out a win
- **Length:** ~0.3–0.7 s.
- **Plays:** on **Soundeffects** when you cash out.
- **Prompt:**
  > A satisfying cash-out chime: bright two-note ascending bell with a quick coin/cash
  > sparkle, positive and rewarding. Clean, short (half a second), mono, no music.

---

## C. ElevenLabs — Voice (use "Text to Speech")

> Pick one clear, energetic English voice (e.g. a confident mission-control / announcer
> voice). Keep the same voice across these so it's consistent.

### 7. `countdown.mp3` — the launch countdown (combined clip)
- **The on-screen countdown runs from 5**, so record the **full** count.
- **Length:** ~5–5.5 s. Pace it **one number per second** so each spoken number lands
  while the screen shows it, and "liftoff" lands at the launch (end of the 5 s window):
  5 → ~0 s, 4 → ~1 s, 3 → ~2 s, 2 → ~3 s, 1 → ~4 s, "we have liftoff" → ~5 s.
- **Plays:** on the **Voice** bus during the countdown (the game adds a NASA-radio filter
  and auto-times itself to the clip length).
- **Say exactly:**
  > Five… Four… Three… Two… One… We have liftoff!
- **Voice direction:** calm, confident mission-control announcer; clear ~1-second gaps
  between numbers; punch the final "We have liftoff!".
- *(The game auto-detects a full-length clip like this and syncs the numbers to it. A
  short "Three, Two, One, Liftoff!" clip still works too if you prefer.)*

### 8. "Big win!" cheer — *only if you keep `jackpot.mp3` purely musical*
- The game already speaks "Big win!" via the device voice as a fallback. If you want a
  produced version, bake an excited shout of **"Big win!"** into `jackpot.mp3` (the game
  loads only that one file for the celebration).
- **Voice direction:** excited, celebratory, slightly shouted, like an announcer reacting
  to a huge win.

---

## D. After generating

1. Drop the files in `public/sounds/` with the exact names above.
2. Make sure the three **loops** (`music`, `engine`, `thrust`) are trimmed to a clean
   loop point (no click at the seam).
3. Commit them and redeploy. On the phone, the first tap unlocks audio (iOS), then the
   new sounds play automatically.
4. Balance the mix in **Settings → Audio** with the Music / Soundeffects / Voice sliders.

> Filenames the game looks for: `music.mp3` · `jackpot.mp3` · `engine.mp3` · `thrust.mp3`
> · `explosion.mp3` · `cashout.mp3` · `countdown.mp3` (or `3/2/1/liftoff.mp3`).
