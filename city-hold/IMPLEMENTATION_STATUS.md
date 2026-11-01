# CITY HOLD — implementation status

## Start locally

Requires Node.js 20+ (developed with Node 22).

```bash
cd city-hold
npm ci
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). `npm run build` produces a static build in `dist/` (`npm run preview` serves it). No API keys or network services are needed to play.

Stack: TypeScript 5.9, Three.js 0.187, Vite 8, Vitest 5 — versions pinned exactly in `package.json`, `package-lock.json` included.

## What is playable

All six campaign districts can be played from both sides against AI:

| District | Special geometry (tested separately) |
|---|---|
| Paris — fountain district (tutorial) | central fountain obstacle, two side streets, foreground street, three shops in the fixed order jewellery / electronics / fashion |
| Amsterdam — canal quarter | impassable canal; only two bridges cross it; blocking both bridges is refused |
| London — high street | covered shopping passage through a building; railed underground-stair spawn that opens to one side only |
| Milan — piazza and arcade | walkable arcade with solid columns; detection halved under the arcade roof; third shop under the arcade |
| Berlin — courtyards | planted traffic island; archway through the front block into a real courtyard with the third shop |
| São Paulo — retail forecourt | service lane / loading yard, rear approach, supply truck (stops for people, pays 200 once) |

The optional second Paris district (image 20, boulevard) is **not built**.

Progression: Paris is open; winning a district (either side) unlocks the next. Winning Paris unlocks the sandbox selector. Progress, research points and settings are stored in `localStorage`; the menu has **Reset progress**.

### Defence
- 1,500 budget, three stores with 100 structure / 100 stock, a mobile security reserve and the support van (staging point; new teams appear there).
- Preparation phase until **Start wave**; the next wave's offender types and entry arrows are shown.
- Buy security (250), shield team (400), firefighter (250); place barrier (150, small socket), concrete barrier (350, large socket, double durability), camera mast (200). Unaffordable cards are disabled; every purchase deducts once.
- Placement only on marked sockets; a placement that would cut every route is refused.
- Tap a team (cyan ring) then the ground: path preview + destination marker. Tap an offender to order an intercept; tap a fire with a firefighter selected.
- Security intercepts one offender at a time with a restraint progress bar, then escorts them away. Shield teams hold up to three offenders (HOLD bar, recoil). Cameras only detect (they extend response range and speed up detection).
- Offenders damage the shutter first, then spend time collecting; stock is deducted **only on extraction**. Interception drops the goods (falling box + marker) and returns them to that store. Loaded carriers are 25 % slower.
- Vandals can start fires at breached stores and on parked cars; store fires keep damaging the shopfront until a firefighter extinguishes them.
- Upgrades with current/next values shown: shutter L2 (300, +60) and L3 (500, +100) — repairs only the added capacity; security level 2 then **Mobile response** or **Fixed protection**; camera **Wider coverage** or **Faster detection**.
- 12 waves; +350 after each wave. Win: all waves with ≥2 stores holding stock. Lose: two stores emptied. Later waves add runners, vandals and heavy carriers (distinct silhouettes + icons).

### Looters
- 1,000 budget, 8-minute timer, target 60 extracted stock. Recruit runner (100), carrier (150), heavy carrier (200: 2× runner capacity, 20 % slower than a carrier) and vandal (200: fast shutter damage, carries little).
- Tap a store to target it, tap an orange arrow (or **Route**) to choose the approach/extraction route, then **Dispatch**. Approaching units can be selected and retargeted to another store.
- Extracted stock earns 25 budget per point. One exclusive group upgrade: capacity +30 % or speed +15 %.
- The AI defence uses the same units, movement, capacity and interception rules (one security, one shield, a camera and a firefighter, reinforcing from income).
- Lose when time runs out or no units remain and nothing can be recruited.

### Common
- Pause, 1×/2× speed, restart, settings (volume, reduced effects, tips), result screen with stores held / stock extracted / research points / specialisations / unlocks.
- Desktop: drag to pan, wheel to zoom, WASD/arrows, P/Space pause, Esc cancels. Touch: drag, pinch, two-finger pan, tap. Landscape preferred; portrait has a compact HUD and a collapsible details panel.
- Foreground roofs, the Berlin front block and arcade roofs fade when they hide units or shop entrances.
- Balancing values are in `src/config/balance.ts`.

## How it was tested

- `npm test` — 36 Vitest tests on the simulation (no rendering):
  budget/purchase accounting and denial; wave reward once per wave; socket size/occupancy rules; refusing a placement that blocks every route; shutter upgrade capacity and partial repair; stock deducted only after extraction; interception returns goods once and removes the offender; loaded/heavy speeds; shield three-offender limit; barrier breaking reopens the lane; fire damage stops only after extinguishing; reachability of every store from every spawn and to an exit (all six districts); paths never cross obstacles; no teleporting or entering obstacles during a full scripted match; defence win (all 12 waves) and defence loss; looter win, looter loss by no units, looter loss by timer; exclusive looter upgrades; retarget only before entry; security specialisation rules; save → reload → reset.
  City tests: Amsterdam paths cross only on bridges and a walking unit never stands on water; one bridge can be blocked but not both; Milan columns solid and arcade traversable, reduced detection under the roof; Berlin courtyard reachable only through the arch and the arch cannot be sealed; London passage and stair exit; São Paulo rear approach, truck stops for a person and pays exactly once.
- `PROBE=1 npm test` prints balance runs: on every district a scripted defence wins all 12 waves, a passive defence loses (wave 5–6), and a scripted looter completes extractions (it wins most runs).
- `tools/e2e.cjs` — browser test driving the real UI with Playwright/Chromium (not a project dependency): place a barrier by tapping a socket, cancel an invalid placement without charge, select and move the reserve, upgrade a shutter from the store label, resolve wave 1 with a single reward, restart (one canvas, fresh state), lose a defence match (result screen), target/recruit/dispatch as looters through to a result screen, reload and verify saved research points, portrait layout with no HUD button under 28 px. Run on Paris and Amsterdam with no page errors.
  `npm run dev` then `node tools/e2e.cjs http://localhost:5173/ test-output paris`
- Screenshots of every district were inspected in headless Chromium (software WebGL).

## Known limitations (honest)

- **Visuals are closer to the concept art but still clearly game-like.** Rendering now includes HDR bloom, a blue-hour colour grade with vignette, a planar wet-street reflection with vertical light streaks, normal-mapped setts, glowing windows (emissive facade maps), detailed Haussmann/brick/Italian facades with continuous iron balconies, slate roofs with chimney pots, cast-iron lanterns, autumn trees, shrubs, benches, iron quay railings and shop interiors with displays that empty as stock drops (see `docs/screenshots/graphics_before_after_concept.jpg`: before / now / concept). Buildings are still boxes with painted facades (no modelled window depth), and people are low-poly capsule figures with procedural animation and contact shadows — not rigged, skinned or textured models. The supplied PNGs are used for the menu backgrounds and action cards only. Damage is procedural (cracked/shattered glass, bent shutter, debris, emptied displays, fires, burned car); the disorder paintings 05–07 and 32–36 are mood references only, by design.
- The wet reflection renders the scene a second time at half resolution, plus a bloom pass. With **Reduced visual effects** (default on touch devices) both are switched off, along with shadows.
- Map geometry is axis-aligned: diagonal streets from the paintings are simplified to straight streets. Layouts follow the references loosely, not exactly. Canal water is drawn at street level behind quay edges and railings rather than as a sunken channel.
- Performance was only measured in headless software rendering: about 600 draw calls with ~10 people on screen. There is no instancing yet, so large late waves may run slowly on low-end phones; touch devices start with reduced effects (no shadows, fewer particles).
- Balance was tuned with scripted bots, not human play. Looters seem easier outside Paris (the scripted looter wins most runs there).
- Collisions between people are soft (they push apart), so crowds can overlap briefly. The supply truck pushes people aside and stops for anyone in front of it; attackers do not target the truck.
- Sounds are simple synthesised tones. UI text is English.
- Research perks are small: +100 starting budget, faster restraint, +1 looter carry.
