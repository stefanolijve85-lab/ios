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

## Paris toward concept images 01-03 (pass 2)

- Fountain: round basin on a raised two-step stone platform with benches and planters, a sculpture group of four seated figures on the pedestal, darker teal water and thinner, paler falling water (the octagonal version stays for the showroom).
- Wet street: long light streaks from every lamp and the shop windows, smeared towards the camera (the camera never turns, so they are static and cheap; also on phones).
- Café: large cream parasols with a warm glow over the CAFE RIVE terrace and the foreground terraces; tree crowns in autumn olive/ochre; a full row of bollards along the foreground pavement.
- Shop windows: jewellery has stepped velvet plinths with neck busts and lit gold necklaces behind each pane; electronics has a big lit screen on a stand. Both are stock items, so they disappear when the shop is looted.
- Draw calls on the emulated phone went up from about 390 to 460 (frame time still about 9 ms in software rendering).
- Comparison: `docs/screenshots/paris_concept_vs_game_2.jpg`.

## Paris: passers-by, café terraces, police line

- Passers-by: up to 14 on desktop / 6 on phones (was 6/3), a new one every 2.5 s, and half of them are already on the square at the start. 60 % first stop at a shop window, the fountain or the café for 3–9 s, then walk to an exit.
- Café terraces: bistro tables (marble top, rattan chairs) in front of CAFE RIVE and around the foreground umbrellas, with 10 guests (4 on phones). Guests run off when looters or fire come close and return in the next preparation phase.
- Police line: crowd fence and three officers at the staging van. Purely decorative: they never move, never flee, cannot be selected and do not affect the game.
- All of these use a separate random stream and never block or change the game (tests in `tests/npc.test.ts`).
- Foreground roof blocks lowered to 7 m so the staging van and police line stay visible from the default camera.
- Path smoothing now checks every grid cell a straight line crosses (exact grid traversal) instead of sampling points; a route could otherwise clip a corner of the fountain.
- A civilian that cannot reach its exit leaves after a few attempts instead of searching for a path every frame (this was making the simulation 12× slower).
- Screenshots: `docs/screenshots/paris_ambient_overview.png`, `paris_cafe_terrace.png`, `paris_police_line.png`.

## Paris toward concept images 02/03 (pass 1)

- Camera: lower, oblique view (pitch 54° → 46°, default distance 52 → 44) so the shopfronts read as in 02/03; default target keeps the staging team clear of the HUD.
- Shops: concept colours (jewellery red, electronics navy, fashion green) and warm, glowing interiors; store labels are now compact shield badges with two thin bars (details on hover/selection).
- Square: extra double-globe lamps between the shops and on the foreground pavement, bigger warm light pools and more real lights (desktop), warmer sky/ground light, crowd-control fences at the side facades, two more trees, lower foreground roofs.
- Fountain: weathered limestone, darker water lit by warm underwater lights, lighter falling-water sheets.
- Cobbles: the dark diamond grid between the fan patterns is filled with loose setts.
- Still different from the concept: far fewer pedestrians, plainer window displays, the fountain has no sculpture group, the square is larger and emptier, no café furniture or police line. The final GLB models (shops, fountain, people) remain the biggest step. Comparison: `docs/screenshots/paris_concept_before_after.jpg`.

## RIOTS menu (RIOTS_UI_Package, references 01–04)

- Game is now called **RIOTS** (page title, HUD, menu). The save key `cityhold.progress.v1` is unchanged, so existing progress stays.
- Start screen (02), city select (03) and side select (04) are real HTML/CSS (`src/ui/menu.ts`, `src/ui/menu.css`). Only text-free crops of the references are used as images (`tools/prepare_menu_art.py` → `public/menu/`); no mockup is shown as a background and no text sits on baked labels.
- Flow: SPELEN → city → VERDER → side + difficulty → START MISSIE. VOORTGANG = campaign + research, INSTELLINGEN = sound, language (menus NL/EN), graphics, tips and a reset that needs a second confirmation. TERUG and Escape go back. After a match you return to the side screen.
- Difficulty (Normaal/Moeilijk/Expert) really changes the match (`DIFFICULTY` in `src/config/balance.ts`); Normaal is identical to the old balance.
- **Paris only for now:** the other five cities are shown with a lock and "Nog niet speelbaar" until their asset packs arrive (their old prototype maps are kept, `playable: false`).
- Fonts: the generated lettering in the references is replaced by **Anton** (titles, with a grunge mask), **Barlow Condensed** (buttons/labels) and **Barlow** (body), all SIL OFL via `@fontsource`, bundled locally.
- Known deviations from the references: the Paris hero is a crop of 03 and slightly upscaled; the side-select backdrop is a blurred lower part of the cover (the reference backdrop sits behind baked UI); the HUD in the match is still English; the other cities' heroes are concept maps, not the 03 artwork.
- Checked in headless Chromium at 1672×941 (reference ratio), 1440×900, 390×844 and 844×390: no horizontal scroll, no console errors; screenshots in `docs/screenshots/menu/`. Not tested on a physical phone.

## Asset upgrades: rig, people, flipbooks, PBR, HDRI, templates

- Character GLBs are auto-rigged skinned meshes (`src/render/rig.ts`); verified in the browser (skinned meshes animate, throw clip with hand socket).
- Neutral shopkeepers, civilians and a helper (separate random stream, no gameplay effect, mobile cap 3 / desktop 6).
- Fire/smoke/gas flipbook atlases; generated PBR sets on ground (puddle roughness), roofs (slate) and facade cores (limestone); generated blue-hour HDRI as environment.
- Artist templates in `assets/model_templates`. The network policy of this environment blocked api.polyhaven.com / dl.polyhaven.org, so no photographic CC0 materials or HDRI could be fetched.
- Measured (software rendering, iPhone emulation, mobile quality): ~15 ms per frame, ~390 draw calls in the play scene. The pack target of ≤ 150 draw calls on mobile is still not met.

## Thrower unit (throw-pose packs)

- New looter class **Thrower** (card; also in defence waves from wave 4). Outfits rebuilt from `assets/throw_poses` (masked 1–3, thrower 1–3). It throws a fictional incendiary game object (procedural exterior only: bottle, cloth, small flame) at its target store or at marked burnable cars — never at people.
- Animation: procedural keyframes wind-up → whip → **release (39 %)** → follow-through → idle, feet planted, body turned to the aim point; baked as clip `throw` into every character GLB; node `hand_socket` holds the object until release.
- One release event per throw (an interrupted wind-up never releases); configurable arc (`BALANCE.throw`); collision with buildings/walls along the arc; the AI only throws when the arc is clear; exactly one impact event per projectile (effects deduplicated by projectile id); projectiles pooled and capped (4 mobile / 8 desktop).
- Fire: store fires burn boards first, then structure, never stock; burning objects show a FIRE indicator; firefighters walk to a reachable spot and extinguish; afterwards flames stop, smoke fades, soot and damage stay. One fire per object, global fire cap; street fires burn out after 5 s.
- Tested: `tests/throw.test.ts` (release/impact once, interrupted wind-up, building collision, repeated impacts, cars, extinguish keeps damage and stock, caps), browser frame sequence and pose close-ups in `#fxroom`, phone e2e, pause/restart via the existing e2e. Not tested on real devices.

## Paris realism, street props and effects packs

- **Shops:** six procedural shop modules from `assets/paris_realism` (see `ASSETS_TODO.md`). Damage, boards and stock are independent: `src/render/shopVisualState.ts` is a TypeScript port of the pack's helper; it only reads game state. New gameplay actions in the store panel: **Board up** (120, a 50-point protection layer broken before the shutter) and **Repair** (200, between waves, restores structure only — stock is never refilled). The shutter upgrade, waves, loot accounting (stock → carried → dropped → returned or escaped), routes and the save format are unchanged.
- **Street objects:** eight objects from `assets/street_props` as procedural 3D; the shelter blocks only its rear and sides, the van its footprint; barriers are still refused when they would cut every route. Tree crowns and the shelter roof fade when they hide units.
- **Effects:** pooled sprite particles from `assets/effects_characters` with presets from `effect_presets.json`; global cap 64 (mobile) / 160 (desktop); fire = flames + smoke with one emitter per fire id that stops when extinguished (short smoke tail); one-shot events (breach sparks, glass, vehicle-fire flash, interception) are deduplicated by event id; particles freeze while paused; emitters are cleared on restart. The vehicle-fire flash is visual only. There is no camera shake. Firefighters have a hose with a nozzle socket and a water jet towards the fire.
- **Developer pages** (not linked from the player UI): `#showroom` (six shops side by side; damage, stock, boards, breach, shutter level, quality; near/mid/far/game camera; street props; fountain) and `#fxroom` (each effect on light and dark ground, in front of and behind a wall; bursts, stress test, pause, extinguish, quality).
- **Measured** (headless Chromium with software WebGL — no real phone or GPU was available): phone emulation (iPhone 13 landscape, mobile quality) ≈ 11 ms per frame and about 360 draw calls in the play scene; effect stress test stays at or below the cap (≤ 104 of 160 desktop, ≤ 43 of 64 mobile). Not measured: real iOS/Android devices, real desktop GPUs. The pack's draw-call target (≤ 150 on mobile) is **not** met yet.
- Screenshots (same camera before/after): `docs/screenshots/paris_before_after_same_camera.jpg`, `paris_before_after_damage_same_camera.jpg`; plus `shops_*`, `street_*`, `effects_showroom.png`.

## Paris street realism pass

- **Buildings:** modular Haussmann facade kit with real depth (see `ASSETS_TODO.md` for the full list), drawn as one InstancedMesh per element type per building.
- **Shops:** shopfronts with real interiors, fictional names, products tied to stock, shutter levels and damage states (cracked, shattered, breached with bent shutter, boxes and shards).
- **Street:** fan-pattern setts, pavements with kerbs and gutters, manhole covers, drain grates, cast-iron lamps, Davioud-style benches, a moulded fountain with falling water and underwater lights; build sockets are faintly marked during preparation.
- **Lighting:** blue hour with warm shop and lamp light, soft moon shadows (only the moon casts shadows), wet-street reflections capped so highlights stay controlled; fire and smoke stay local.
- **Performance:** shared geometry/materials, instancing for facades and products, static props/fountain/shop interiors merged per material (phone draw calls 718 → 394), point lights capped (3 lamps + 3 shops + 2 fire). **Mobile quality** (default on touch devices): no reflections, bloom or shadows, pixel ratio ≤ 1.5. Measured in software rendering: ~4 ms per frame in mobile quality.
- **Phone layout:** compact layout for phones held sideways (cards in one row, tips and loop checklist never cover the cards); `tools/e2e-mobile.cjs` plays the defence loop on an emulated iPhone with taps only.
- Screenshots: `docs/screenshots/paris_street_kit_overview.png`, `paris_street_kit_damage.png`, `paris_phone_landscape.png`.

## Paris-street milestone: temporary 3D models and the complete loop

- Characters and props are loaded from **model slots** (`src/render/assets.ts`, `public/models/manifest.json`). All 29 slots are filled with temporary GLB models generated from the procedural figures (`npm run placeholders`), including 14 baked animation clips per character. Final GLBs replace them without code changes; the menu **3D assets** and `ASSETS_TODO.md` list what is still missing. If a model cannot be loaded the game falls back to the procedural figure.
- The full loop is shown in-game as a checklist and verified both in logic tests (`tests/cycle.test.ts`) and through the real UI (`tools/e2e.cjs`): defence — place defences → start wave → protect → intercept → +350 reward → upgrade bought from that reward; looters — recruit → dispatch → loot → extract → +25/stock reward → upgrade. (In the browser test the looter budget is topped up to 300 only if the extraction reward alone is short, so the upgrade button can be exercised; the logic test covers a reward-funded upgrade.)
- Dutch start instructions: `STARTEN.md`.

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

### Extra streetwear characters
`assets/units/extra_streetwear/01-10` (see `docs/EXTRA_STREETWEAR_README.txt`) are rebuilt as ten 3D outfits for the looter classes in `src/render/humans.ts` (`STREETWEAR`): tracksuits with side stripes, quilted puffer jackets, padded vests over hoodies, windbreakers, raised hoods with face coverings, small/large backpacks, black shopping bags, cardboard boxes and a boxed television. Four in five attackers wear one of these outfits; the rest keep the earlier casual clothing. Outfits change appearance and the look of carried goods only; class stats are unchanged. The supplied sheets all show one skin tone, so skin tone is still randomised over the full range in game, as `docs/GAME_DESIGN.md` requires a varied cast on both sides. The carrier and vandal cards now use images 06 and 01.

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
