# Shadow Rush — Chase & Survive

A premium, mobile-first **action runner** that fuses endless-runner accessibility with
cinematic combat and **casino-style escalating multipliers**.

> *Temple Run meets Subway Surfers meets Agent Dash — with auto-targeting shootouts,
> combo chains and the “just one more run” pull of a jackpot.*

You play **Shadow**, sprinting through a neon cyberpunk skyline at ever-increasing
speed — switching lanes, vaulting obstacles, sliding under barriers, gunning down
criminals who pop from cover, and grabbing loot while the multiplier climbs.

This is a **single-file HTML5 canvas game** — no build step, no external assets, no
network. It runs on phones (touch) and desktop (keyboard) at 60 FPS.

## Run it

Just open `index.html` in any modern browser. Or serve the folder:

```bash
cd shadowrush
python3 -m http.server 8080      # then open http://localhost:8080
```

Add it to your phone home screen (it ships a web-app manifest) for a fullscreen,
portrait, app-like experience.

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Switch lane | swipe ◀ ▶ | `←` `→` / `A` `D` |
| Jump | swipe ▲ or tap | `↑` `W` `Space` |
| Slide / roll | swipe ▼ | `↓` `S` |
| Pause | pause button | `P` / `Esc` |

Shooting is **automatic** — Shadow auto-targets the nearest criminal. You focus on
movement, dodging incoming fire, and chasing loot.

## Core mechanics

- **Pseudo-3D 3-lane runner** with a perspective road, parallax neon skyline and a
  continuously accelerating pace + rising difficulty.
- **Obstacles** that each demand a different reaction: barriers/trains (jump),
  overhead bars (slide), and full blockers (dodge to the open lane).
- **Combat:** criminals hide behind cover and pop out to shoot or lob bombs.
  Auto-fire takes them down; **slide under bullets**, **jump over bombs**.
- **Loot:** coins, gems and **mystery power-up boxes**.
- **Power-ups:** 🛡️ Shield · 🧲 Magnet · 🐌 Slow-mo · ✕2 Score · ⭐ Invincible ·
  🔫 Rapid Fire · 🚀 Jetpack.
- **Combo chains** — back-to-back pickups and takedowns stack a combo multiplier.
- **Casino multiplier** — a single dynamic multiplier grows with distance survived,
  takedowns, **near-misses** and combo, and **doubles** under a Score ✕2 drop.
  Stay in longer = exponentially bigger payouts (risk vs reward).
- **Near-miss** detection rewards skillful, last-second dodges with bonus points.

## Meta & casino loop

- **Run-over breakdown** with distance, loot, takedowns, best combo and peak multiplier.
- **Double Reward** (watch-an-ad style 2×) on the score screen.
- **Daily Spin** with a jackpot slot, and a **seasonal global leaderboard** where you
  rank against rivals.
- Best score, coins, gems and run count persist locally (`localStorage`).

## Design notes

The whole game is one file (`index.html`) — HTML, CSS and a ~900-line vanilla-JS
engine. Highlights:

- Custom perspective projection (`scaleAt`/`projY`/`laneX`) for the receding road.
- Depth-sorted scene rendering so obstacles, enemies, loot and projectiles composite
  correctly front-to-back.
- A tiny **WebAudio** synth (`SFX`) generates all sound effects at runtime — no audio
  files needed.
- Particle bursts, screen shake, hit-flash and a vignette for cinematic punch.

No tracking, no ads, no backend — fully self-contained and offline-capable.
