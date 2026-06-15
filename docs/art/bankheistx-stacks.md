# BANKHEIST X — money-stack sprite prompt

For the "growing stacks" feature: stacks of cash that pop in on the vault floor
as the multiplier climbs. I place + duplicate these, so each must be a **single,
isolated, free-standing stack on a transparent background**.

Drop the file(s) and I wire them: `public/themes/bankheistx/stack.webp`
(+ optional `stack-2.webp`, `stack-3.webp` for variety).

---

## 🖼️ Image prompt (Midjourney / DALL·E / etc.)

> A single banded bundle of cash — a thick brick of crisp banknotes wrapped with
> paper currency bands. Heist-vault aesthetic: rich money-green and gold tones,
> dramatic studio lighting from above-front, warm gold rim light and subtle
> glints on the note edges. Photorealistic, ultra-detailed, slight front
> three-quarter top-down view (as if sitting on a floor). Completely **isolated
> on a transparent background** — no scene, no wall, no floor, no text. Centered
> with even padding. Clean cut-out edges. Game-asset sprite. 1024×1024 PNG with
> alpha.

**Negative / avoid:** background, scene, table, hands, watermark, text, logos,
hard drop shadow, multiple separate piles.

## Variations (optional, for natural variety)
- `stack.webp`   — **short**: one single bundle.
- `stack-2.webp` — **medium**: 2–3 bundles stacked.
- `stack-3.webp` — **tall**: a small tower of bundles.

Keep the **lighting + angle identical** across all three so duplicates tile
together naturally on the floor.

## Technical notes
- **Transparent PNG** (alpha). If your tool can't do transparency, render on a
  **flat pure-white** OR **pure-magenta (#FF00FF)** background and I'll key it out.
- A **very soft contact shadow** under the stack is fine (helps it sit on the
  floor); a hard cast shadow is not.
- Consistent **green US-style bills with gold bands** to match the BANKHEIST palette.

> Reuse this per game with its own loot: DEEP DIVE → gold coins / treasure pile,
> TRAINRIDE → cash sacks / crates. Same rules (isolated, transparent, consistent light).
