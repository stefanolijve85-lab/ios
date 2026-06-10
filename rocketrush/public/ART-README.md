# Custom rocket artwork (optional)

Drop a transparent PNG here and Liftoff X uses it **automatically** for the
rocket — no code changes. If a file is missing, the game falls back to its
built-in vector rocket/flame.

| File | What | Tips |
|------|------|------|
| `rocket.png` | the rocket **body only**, **nose pointing UP**, **no flame** | transparent background, tightly cropped, ~256–512 px tall, centered |

Notes
- The engine draws an **animated exhaust flame** anchored to the nozzle
  automatically, so the `rocket.png` should be the **body only** (no flame).
- Keep them small (a few hundred KB) for fast mobile loading.
- After adding files, commit them (`public/` is served as static assets) and
  redeploy. Fine-tuning of size/position can be adjusted in
  `app/game-engine.ts → drawRocket` (the `H0`/`-25` and flame `fh`/`7` values).
