# Landing videos — the standard start screen

Every game's start screen is a **cinematic video** with the logo + a PLAY button
overlaid. Drop `public/themes/<key>/landing.mp4` and add `landingVideo` to the
theme's `assets`. The static `landing.webp` stays as the poster (first frame).

## Specs
- **Portrait 9:16** (vertical) — the start screen is a phone screen; `object-fit:
  cover` fills it, so a landscape video gets heavily cropped. Render vertical.
- ~6–10 s, **loop-friendly** (the last frame should flow back into the first).
- **No baked text / no UI** — the logo + PLAY are drawn on top.
- Muted-friendly (autoplay on mobile requires muted); the game music plays under it.
- Keep it small (≈1–3 MB) for fast load.

## Prompts (Google Veo / ElevenLabs)

**BANKHEIST X** — heist vault
> Cinematic slow push-in toward a massive open bank-vault door, golden light
> spilling out over towering stacks of banded cash and gold bars, floating dust
> and faint embers, red security lasers crisscrossing, a tense high-stakes heist
> atmosphere. Dark, moody, premium, shallow depth of field. Vertical 9:16,
> seamless loop, no text, no people.

**TRAINRIDE X** — runaway train (delivered)
> Cinematic push along a speeding steam locomotive racing over a trestle bridge
> at dusk, sparks and smoke, dramatic warm light, sense of imminent danger.

**DEEP DIVE X** — descent (delivered)
> Cinematic descent of a submarine into a dark abyss toward a glowing treasure,
> light beams cutting through the deep, bubbles and drifting particles.

> Template for new games: "Cinematic [slow push-in / descent / chase] of
> [the game's hero] in [the setting], [signature lighting], [mood]. Vertical 9:16,
> seamless loop, no text, no people."
