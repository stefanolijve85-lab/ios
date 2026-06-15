# Adding a new game (OliveX engine)

One engine, many games. A new title = **art + a config**, no engine code. There
are only **4 places** to touch. BANKHEIST X is the reference; copy it.

Below, `<key>` is the game's id (lowercase, no spaces), e.g. `liftoffx`.

---

## 1. Drop the art + audio  →  `public/themes/<key>/`

Use these **exact filenames** (the theme maps to them). Match the reference
sizes/aspect ratios so the layout fits without tweaking CSS.

### Images (`.webp`)
| File | What | Size (reference) | Aspect | Notes |
|------|------|------------------|--------|-------|
| `logo.webp` | wordmark | ~660×157 | 4.2:1 | **transparent** background |
| `landing.mp4` | **cinematic start screen (standard)** | portrait | 9:16 | logo + PLAY are overlaid; set `assets.landingVideo`. See `docs/video/landing-videos.md` |
| `landing.webp` | start-screen poster / fallback | 852×1846 | 0.46:1 (phone) | first-frame poster behind the video (and used if no `landing.mp4`) |
| `<idle>.webp` | idle/running scene | 760×997 | 0.76:1 (portrait) | shown `cover` anchored top → keep the subject in the **upper half** |
| `<lose>.webp` | crash scene | 1024×759 | 1.35:1 (landscape) | character centred; fills via `cover` |
| `<win>.webp` | secure/win scene | 853×632 | 1.35:1 (landscape) | character centred; fills via `cover` |
| `icons/*.webp` | 5 menu icons | 96×96 | 1:1 | home, history, (game), leaderboard, chat |

> The exact `<idle>/<lose>/<win>` and icon filenames are whatever you put in
> `theme.ts` (step 2). For LIFTOFF X they are `launchpad/explosion/eject`.

### Audio (`.mp3`)
| File | What | Notes |
|------|------|-------|
| `audio/motif-low.mp3`, `audio/motif-high.mp3` | tension bed | seamless **loops** |
| `audio/lobby.mp3` | ambient between rounds | seamless **loop** |
| `audio/<cashout>.mp3` | cash-out sfx | one-shot |
| `audio/<crash>.mp3` | crash sfx | one-shot |
| `audio/<tick>.mp3` | betting countdown | **~4.6s** so it ends exactly at 0 (betting is 5s) |
| `audio/voice-win-1..5.mp3` | win voice lines | 5 short clips |
| `audio/voice-crash-1..5.mp3` | loss voice lines | 5 short clips |

---

## 2. The theme  →  `src/themes/<key>/theme.ts`

Copy `src/themes/bankheistx/theme.ts` and fill in: `key`, `name`, `meta`,
`colors` (the green-token palette → your game's colours), `assets` (paths to the
files above), `audio` (paths), and `copy` (cash-out verb, scene labels, flash
text, voice line count). **Presentation only** — never any math.

Then register it in `src/themes/index.ts`:
```ts
import { <key> } from './<key>/theme';
export const THEMES = { bankheistx, liftoffx, <key> };
```

## 3. The feel (tuning)  →  `server/config.js`
Add one line under `games`. Curve speed + ceiling + run length (and an optional
default `rtp`):
```js
<key>: { GROWTH_K: 0.25, MAX_MULTIPLIER: 500, MAX_RUN_MS: 22000 },
```

### RTP is configurable
RTP variants live in `RTP_VARIANTS` (99/97/96/95/94 → house edge). Resolution:
1. **env `XIT_RTP=96`** — sets the whole deployment's RTP (how an operator runs
   their instance at a chosen RTP, no code change).
2. `games[<key>].rtp` — a title's own default.
3. `DEFAULT_RTP` (97).

The active RTP is sent to the client and used by the provably-fair verifier, so
every deployment stays transparent and player-verifiable at its own RTP.

## 4. The catalog  →  `src/brand/index.ts`
Add it to `CATALOG` (drives the future hub + keeps the line-up in one place):
```js
{ key: '<key>', name: 'YOUR GAME', domain: 'yourgame.com', tagline: '…', live: true },
```

---

## 5. Point the domain
Buy `yourgame.com`, add it as a Custom Domain on the Render service, and the
hostname resolver routes it automatically (`themeKeyForHost`). Preview locally
with `?theme=<key>`.

That's it. Provably-fair, RTP, double bets, auto-bet, auto cash-out, chat, live
feed and the leaderboard are all inherited from the shared engine.
