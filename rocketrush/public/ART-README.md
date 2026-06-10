# Custom rocket artwork (optional)

Drop a transparent PNG here and Liftoff X uses it **automatically** for the
rocket — no code changes. If a file is missing, the game falls back to its
built-in vector rocket/flame.

| File | What | Tips |
|------|------|------|
| `rocket.png` | the rocket **body only**, **nose pointing UP**, **no flame** | transparent background, tightly cropped, ~256–512 px tall, centered |
| `flame.png` | the exhaust flame, **pointing DOWN** (optional) | transparent background; the top of the flame should be at the very top of the image |

Notes
- The engine adds an animated engine glow behind the rocket automatically, so the
  `rocket.png` should **not** include a flame (use `flame.png` for that, or let the
  built-in animated flame play).
- Keep them small (a few hundred KB) for fast mobile loading.
- After adding files, commit them (`public/` is served as static assets) and
  redeploy. Fine-tuning of size/position can be adjusted in
  `app/game-engine.ts → drawRocket` (the `H0`/`-25` and flame `fh`/`7` values).
