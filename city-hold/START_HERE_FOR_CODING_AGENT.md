# Build CITY HOLD

You are the implementation agent. This folder contains a complete creative/design handoff, not a completed game repository. Build a functioning game from it. Do not submit work to Higgsfield, invoke paid media services, or spend credits as part of this task.

## Read and inspect first

1. Read README.md, docs/GAME_DESIGN.md and docs/ASSET_GUIDE.md.
2. Inspect assets/manifest.json and representative clean maps, damaged maps, units and action sheets.
3. Inspect the 28-second video in references/. If direct video viewing is unavailable, extract representative frames with local video tools. The video is scripted and compresses a match; reproduce the interactions, not its fixed event timeline.
4. Check whether the working folder contains an existing implementation before initializing a project. Preserve any unrelated user work.

## Target

Create CITY HOLD: realistic urban tower defence combined with tactical strategy, with Defence and Looters as two playable sides. Use one consistent elevated oblique 3D camera with zoom and pan, coherent human scale, local architecture, independent units and game-state-driven damage. Begin with the original Paris fountain map, then extend to Amsterdam, London, Milan, Berlin and Sao Paulo. The extra Paris boulevard is optional.

## Implement in reviewable milestones

A. First playable Paris district: a runnable project, start screen, Defence/Looters choice, one coherent map with three store entrances, obstacles, valid paths, mobile camera, touch/mouse controls and reset.
B. Working defence loop: actual unit selection/movement, purchases, budget accounting, waves, store durability, stock, carrier extraction and interception. Complete a short test match before expanding wave count.
C. Working attacker loop on the same map: recruit, target selection, dispatch, AI defence, stealing and extraction with actual scoring, win/loss and restart.
D. Store and unit upgrades with real stat changes, wave progression, research/progress saving, result screen, sound/effect settings and feedback. Use the detailed initial balancing values in GAME_DESIGN.md, then tune after verifying mechanics.
E. Distinct navigable maps for all six cities, using shared systems. Bridges must actually bridge impassable water; covered arcades and courtyard gates must actually connect areas. Only present a district as playable when it works.
F. Visual refinement: local storefront detail, character variety, grounded movement and contact animations, separate fire/smoke/debris, damage stages and readable UI. Reuse the art direction without baking crowds into the active map.

Continue through the milestones within the authorized task instead of stopping after a plan or static mock-up. If a material technical limitation prevents a requested feature, report it accurately and leave a concrete runnable result for review.

## Choose an implementation responsibly

Choose a suitable maintained browser-game stack after inspecting the environment. Keep deployment optional; provide a local run command. Pin dependencies, include a lockfile and document setup. Do not invent assets that are not supplied. No external API keys should be required to play.

Raster images are appearance references. They are not 3D meshes, collision geometry or rigs. Create coherent scene geometry and independent actors. Simple placeholder geometry may be used internally to validate mechanics, but describe the visual quality honestly and refine it toward the references. A screenshot with moving flat portraits is not equivalent to a fully modelled 3D district.

## Important rules

- Exact game geometry is defined once per map and stays consistent across zoom and damage states.
- Do not teleport units across buildings, fountain basins, water, barriers or closed walls.
- Normal and loaded states are different: loaded carriers are slower and only extracted goods count as permanently lost.
- Interceptions recover goods; money/rewards must be applied once.
- Player faction and unit stats are independent of ethnicity, skin tone and gender. Use a varied adult cast on both sides. Civilians remain neutral.
- Confrontations use blocking, pushing, recoil, interception and escort states without graphic injuries.
- Support desktop and touch; keep UI usable in landscape and portrait.
- Do not publish or send external messages as part of the build. Deliver code, local run instructions and an honest status report.

## Validation

Exercise a full defence wave and an attacker extraction, both victory and defeat, restart, budget limits, store upgrades and save/reload. Verify pathfinding separately for bridges, arcades, courtyards and loading lanes. Check camera bounds and touch targets. Use focused tests for game logic and manual/automated visual checks for interaction; do not treat a successful bundler build as gameplay validation.

## Delivery

Leave the implementation in this project folder with a concise IMPLEMENTATION_STATUS.md stating what is playable, what was tested, known limitations and the exact local start command. Preserve the supplied creative assets and reference video. Make the game itself the primary deliverable.
