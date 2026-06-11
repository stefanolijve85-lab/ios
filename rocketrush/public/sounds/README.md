# Custom game sounds (optional)

Drop audio files here and Liftoff X uses them **automatically** — no code
changes. If a file is missing, the game falls back to its built-in synth + an
English text-to-speech voice. Files are preloaded on boot and played after the
first tap (iOS unlocks audio on a user gesture).

## Filenames the game looks for

| File | When it plays | Suggested length |
|------|---------------|------------------|
| `explosion.mp3` | rocket blows up (crash) | ~0.8–1.5 s |
| `liftoff.mp3` | the moment the rocket launches | ~0.6–1.5 s (a clear English "Liftoff!") |
| `engine.mp3` | loops continuously during flight | 1–3 s, **seamless loop** |
| `thrust.mp3` | thrust-alarm bed, loops every flight (Soundeffects slider) | 1–4 s, **seamless loop** |
| `3.mp3`, `2.mp3`, `1.mp3` | the countdown, one per number | ~0.4–0.6 s each (English "three / two / one") |
| `cashout.mp3` | you cash out a win | ~0.3–0.8 s |

You don't need all of them — provide any subset. For example, just add
`explosion.mp3` + `3.mp3` `2.mp3` `1.mp3` `liftoff.mp3` for a real voice and a
real boom; the engine rumble will stay synth until you add `engine.mp3`.

## Format tips
- **`.mp3`** is the safest cross-browser/iOS choice (you can also use `.m4a`/`.wav`
  if you rename the entries in `app/game-engine.ts → SND`, but mp3 is recommended).
- Keep them **mono or stereo, 44.1 kHz**, normalized so they're not too loud.
- `engine.mp3` should **loop seamlessly** (trim to a zero-crossing, steady rumble).
- Total size: keep each file small (a few hundred KB) for fast mobile loading.

After adding files, redeploy (commit them — `public/` is served as static assets).
