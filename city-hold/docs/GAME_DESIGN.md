# CITY HOLD — game design

Build CITY HOLD, a playable realistic urban tower-defense / tactical strategy browser game, using the LOCAL project assets and gameplay reference video. Read START_HERE_FOR_CODING_AGENT.md first. Asset locations are listed in assets/manifest.json. Filenames keep their original numeric prefixes; use them to resolve the numbered references below.

DELIVERABLE
Create an actual playable game with controls, autonomous opponents, economy, upgrades, win/loss states and restart. The video is a SCRIPTED GAMEPLAY MOCK-UP illustrating interactions and art direction, not an existing functioning game. Its timings compress a match. Do not reproduce it as a video player, slideshow or a static picture with buttons. Reference images are raster concept art and character/prop references, NOT supplied 3D models, collision meshes or rigged animations. Reconstruct a coherent navigable game environment and animated units. Prioritize working strategy and readable paths while matching the realistic look as closely as your environment supports. Do not pretend that flat cutouts are freely rotatable 3D models.

INITIAL SCOPE
Create a six-city campaign with two playable sides and twelve waves per district. Build and validate the original Paris fountain map first, then reuse its working rules for Amsterdam, London, Milan, Berlin and Sao Paulo using images 21-25. Image 20 is an optional SECOND Paris district. Each campaign district needs its own playable navigation, store entrances, legal build sockets, AI routes and extraction points; do not merely swap background images. Play single-player against AI. Unlock subsequent cities after successful missions and persist progress. Include a sandbox city selector after completing the tutorial. Military units remain future scope. No online multiplayer required.

WORLD AND ART
Use images 01 and 02 for the common geographical layout: complete connected Haussmann limestone buildings, slate mansard roof, iron balconies, two side streets, central circular fountain, open foreground pedestrian street. Three shops in fixed order from left to right: burgundy jewellery boutique, navy electronics shop, green fashion boutique. Create plausible doors, frames and shop interiors at consistent human scale. The fountain, buildings and barriers are obstacles, not walkable surfaces. The shops' functional entrances must match their visible doors.
Use 03 and 04 for zoomed architectural detail. Use 05 and 06 for damaged shop states. Image 07 is a late-stage heavy-damage mood reference, NOT the initial game state. Do not start with every shop destroyed. Use 10-19 for unit and prop appearance. Images of cars illustrate appearance; they are not exact matching 3D before-and-after scans.
Rain-wet cobbles, blue-hour sky, warm shop lighting, restrained blue emergency lights. Fires and smoke are local effects that cannot conceal routes or HUD. Realistic human proportions; natural readable movement. No real brands, political flags or identifiable real people. Diverse fictional adult characters on both sides; appearance never determines stats or AI behaviour. Civilians remain neutral. No graphic injury or gore.

CAMERA AND INPUT
Fixed elevated oblique strategy camera with zoom and pan, preserving exact map geometry at every zoom level. Mouse wheel or pinch to zoom; drag empty ground or two-finger drag to pan. Tap/click a unit to select; tap/click valid ground to move a mobile team. Show a thin cyan selection ring, reachable destination indicator and a short path preview. Make obstructing roofs or walls fade when necessary. Clicking an action card and then a legal build socket places that object. Prevent purchases on invalid ground, inside buildings, on the fountain or blocking every access route. Desktop and touch controls must work; landscape is preferred, portrait remains usable with compact UI.

DEFENCE MODE
Start with 1,500 budget and three stores at 100 structure and 100 stock points each. Preparation mode pauses waves until the player presses Start Wave. Show incoming enemy types and entry arrows. Recruit security team for 250, shield team for 400, barrier for 150, camera mast for 200. Include an initial mobile reserve and support van. Each purchase deducts budget exactly once; disable unaffordable actions.
Security teams move quickly and intercept one nearby offender at a time. Shield teams move slowly but hold up to three offenders temporarily. Use a non-graphic restraint/progress mechanic, not firearms. Barriers slow units while their durability lasts; opponents can damage them. Cameras provide information and improve response detection in their visible coverage area; they do not deal damage. The support van is a staging point, not a weapon.
An offender reaching a store first damages the shutter/entrance, then spends time taking stock. Entering is not instant defeat. A carrier must leave through a designated extraction point to make stolen stock count as lost. Carriers move 25 percent slower. Interception drops their goods and removes the offender after a clear feedback animation; recovered goods return to that store's stock. Show a dropped-goods marker.
Store upgrades: shutter level 2 costs 300 and adds 60 structure capacity, repairing only the capacity added; shutter level 3 costs 500 and adds a further 100 capacity. Security specialisations unlock after level 2: mobile response OR fixed protection. Camera specialisations: wider coverage OR faster detection. Show current/next effect and cost before purchase.
Defender success: finish all twelve waves with at least two stores retaining stock. Failure: two stores lose all stock. Award 350 budget after each completed wave. Pause between waves for purchases and recovery. Later waves increase headcount and introduce fast runners, durable vandals and larger-capacity carriers, differentiated by silhouette and clear icons.

LOOTER MODE
Same physical map and consistent entrances; AI operates the defence. Start with 1,000 command budget. Choose one of the three store targets, recruit units, select a marked approach route and dispatch a group. Runner costs 100, faster but lower capacity; carrier costs 150, slower but higher capacity; vandal costs 200, improves the abstract structure-damage stat but carries little. No real-world crime tutorials: these are abstract game values and predefined game routes.
Units automatically approach, resolve entry using abstract durability/progress bars, collect goods, and follow a visible extraction path. Carriers shown in images 13 and 14 represent loaded units; create appropriate unloaded appearances for their approach animation. Units intercepted before extraction do not score. Let the player choose dispatch timing and retarget units before store entry. Upgrade carrying capacity OR speed using earned points; apply actual gameplay effects.
Attacker success: extract 60 stock points within an 8-minute match timer. Failure: timer expires below the target, or no active units remain and budget cannot afford another recruit. Show the extracted stock counter and the selected store's stock. AI defenders obey the same movement, capacity, collision and interception rules.

UI AND FEEDBACK
Faction-selection screen: Defence / Looters; separate icons and concise objectives. In-match HUD: budget, wave or timer, each store's structure/stock, selected unit, recruit/build cards, upgrade panel, Pause, speed 1x/2x and Restart. Clear selection, placement, insufficient-budget and objective-complete feedback. Do not require hover on mobile. Cyan for defender selection, orange for attacker selection; colour is not the only role indicator. Use icons and labels.

PROGRESSION AND RELIABILITY
After a completed match show result, stores held or stock extracted, earned research points and unlocked specialisations. Persist earned progress and settings locally where supported, with an explicit Reset Progress control. Keep combat/stealing stats independent of character skin tone or gender. Costs and numbers above are initial balancing values, not marketing facts; expose them centrally for tuning.
Units need walk cycles, idle, carrying and interception states. Render depth sorting correctly. Apply pathfinding around buildings/fountain and update paths when barriers change; do not teleport. Cap crowds or reduce effects for performance. Do not create invisible hitboxes inconsistent with visible shops. Ensure restart resets runtime state and does not duplicate rewards, timers or listeners. Include functional settings for volume and reduced visual effects.

ACCEPTANCE
Both sides can start, play, win, lose and restart. Players can zoom, select and move teams, purchase and upgrade with visible stat changes. Stock is deducted only after extraction. Blocked routes cannot trap every unit indefinitely. A full first wave and a full attacker extraction can be completed. Use the supplied video for interaction sequence and the images for visual direction, while building a functioning game.


EXPANSION ASSETS AND CITY RULES
20_paris_boulevard.png: France / Paris, optional second district. Split lanes around a planted median. Use the original fountain map for the first tutorial and match the video there.
21_amsterdam_canals.png: Netherlands / Amsterdam. Canal is impassable; only the two bridges connect banks. Respect quays and railings as collision boundaries. Guard either bridge while allowing legal passage. Shops stand on the far bank. Never let units walk over water.
22_london_high_street.png: United Kingdom / London. Three shopfronts near a covered shopping passage. Underground stairs are a marked spawn entry, not a hole units can randomly cross. Two surface streets and passage give separate approaches.
23_milan_arcade.png: Italy / Milan. Open piazza and a covered arcade on the right. The arcade is traversable underneath; columns remain obstacles. Longer-range detection on the square trades off with obstructed sightlines under the arcade.
24_berlin_courtyards.png: Germany / Berlin. Roads around a planted traffic island and a clearly open archway to a courtyard. Include the courtyard as a real navigable area; walls are solid and the arch is a passage.
25_sao_paulo_retail.png: Brazil / Sao Paulo. Contemporary retail forecourt, corner shopping center, loading yard and service lane. Add a distinct rear approach and an escort-style optional supply objective. Do not associate a nationality with enemy strength or criminal behaviour.
All layouts are fictional architectural concepts, not reconstructions of real incidents. National uniforms, official insignia and exact real-world landmarks have not been researched; use fictional equipment consistently across the campaign. Do not mislabel generic unit assets as accurate national police uniforms.
26_runner.png: unloaded fast approach unit. Recreate a loaded appearance after theft.
27_carrier_woman.png: small-bag loaded carrier, variation within the normal carrier class.
28_heavy_carrier.png: high-capacity carrier. Starting proposal: costs 200, carries twice a runner's goods, moves 20 percent slower than a normal carrier. Explain values in its tooltip.
29_firefighter.png: defence support. Starting proposal: costs 250, moves to selected fire, extinguishes it over a visible progress bar. Cannot intercept offenders. Fire damage stops only when extinguished.
30_supply_truck.png: optional mission prop / supply objective. It follows a predefined valid service-road route, stops at the loading point and grants a one-time 200 budget delivery reward. It cannot pass through crowds or buildings and cannot duplicate rewards.
31_concrete_barriers.png: durable roadblock. Starting proposal: costs 350, doubles standard barrier durability, can only occupy designated large sockets. Placement must retain at least one legal AI path.
Appearance variants within a class share stats. Diversity of gender or skin tone does not create different abilities.

DAMAGE AND MULTI-CITY ACCEPTANCE
The original Paris map has supplied damaged-state images 05-07; Amsterdam, London, Milan, Berlin and Sao Paulo now have their corresponding disorder-state references 32-36. Derive dynamic damage from each original clean map geometry: broken shop glass, bent shutters, debris and localized fires. Do not copy Paris buildings into another city's destruction state. Keep the same buildings and entrances across all states and all zoom levels.
Every enabled city selector must lead to an actual playable district with both sides, valid AI paths, extraction scoring and restart. If implementation is staged, expose only completed districts as playable and explicitly mark unfinished ones, rather than making their buttons appear functional. Test bridge routing, arcade column collision, courtyard entry and the loading lane separately. All numerical additions above are adjustable design proposals.


CHAOS AND ACTION REFERENCE EXPANSION — 40 LOCAL REFERENCE IMAGES
32_amsterdam_disorder.png corresponds to clean map 21.
33_london_disorder.png corresponds to clean map 22.
34_milan_disorder.png corresponds to clean map 23.
35_berlin_disorder.png corresponds to clean map 24.
36_sao_paulo_disorder.png corresponds to clean map 25.
These are illustrated mid/late mission states with looting, damaged stores, burning empty vehicles and non-graphic police/crowd confrontations. They are visual guides, not separate replacement maps or baked playable backgrounds. Preserve clean-map street geometry, bridge placement, door locations and collision paths. Reference paintings can contain small inconsistencies; the clean map remains the geometric authority. Fire, smoke, debris, people and damaged shutters must be independent game objects/states. Never place impassable walls or vehicles where the references show the only remaining legal path.
37_run_cycle_reference.png: four running-pose concepts.
38_collect_loot_reference.png: reaching, grasping, lifting and carrying merchandise.
39_shield_contact_reference.png: approach, open-palm contact against shield, recoil and withdrawal.
40_police_advance_reference.png: guard stance, bracing and advancing with shield.
41_interception_reference.png: stop signal, set down goods, controlled upright interception and escort.
42_drop_loot_reference.png: loaded movement, release, falling box and empty-handed retreat.
Each action image is a 2x2 visual pose sheet, read top-left, top-right, bottom-left, bottom-right. These are NOT clean equal-cell production atlases, animation-ready rigs, motion capture, or guaranteed seamless loops. Rebuild coherent animations from them. Do not display all four poses simultaneously as one in-world unit. Preserve each character's identity through animation, use natural alternating limbs, coherent hand-to-box and hand-to-shield contact, and a grounded foot contact.
On shield contact, resolve game resistance/capacity stats with an on-screen progress bar and brief recoil. Interception drops goods and triggers an upright escort/removal state without graphic injury. This is fictional arcade strategy, not a real-world police tactics simulator. All adults have varied appearances across both sides; stats and roles are independent of ethnicity, skin tone or gender.
The existing video still demonstrates only the original Paris tutorial and remains a scripted interaction reference. These new assets do not change its duration or make it a recording of a functioning game.
