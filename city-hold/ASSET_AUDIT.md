# RIOTS — asset-audit (peildatum 1 november 2026)

Deze audit is gemaakt door de code, de configuratie en de bestanden in de repository te lezen en de game te draaien in een headless Chromium (software-rendering). **In deze stap is niets aan de game veranderd.** Bestanden die meegeleverd worden:

- `ASSET_INVENTORY.csv` — één regel per asset (381 regels): stad, categorie, ID, pad, formaat, status, gebruikslocatie, duplicaten, bron.
- `ASSETS_TO_CREATE.md` — wat ontbreekt, per stad en prioriteit, en de eerstvolgende batch.

CITY HOLD is de oude projectnaam; RIOTS de zichtbare naam. Interne ID's zijn onveranderd: stad-ID's `paris`, `amsterdam`, `london`, `milan`, `berlin`, `saopaulo`, savekey `cityhold.progress.v1`, modelslots `char.*`, `prop.*`, `shop.*`, `anim.*`.

## Statusbegrippen (zoals gevraagd)

| Status | Betekenis in deze audit |
|---|---|
| INGEBOUWD EN GECONTROLEERD | wordt door de code geladen én is in deze sessie in de draaiende game gezien (screenshot) of door een test gedekt |
| INGEBOUWD, NOG NIET GECONTROLEERD | wordt geladen, maar niet zelf gezien/getest |
| TIJDELIJKE/PROCEDURELE VERVANGING | in code opgebouwde geometrie of een placeholder-GLB die uit die code is gegenereerd |
| ALLEEN PNG-REFERENTIE | beeld dat als voorbeeld dient; geen model, rig of animatie |
| BESTAND AANWEZIG, NIET GEBRUIKT | staat in de repo maar wordt niet geladen (bijv. vervangen placeholder, sjabloon) |
| ONTBREEKT | niet aanwezig; "(niet ontvangen)" = genoemd in een pakket maar de ZIP is niet bij mij aangekomen |

Telling in de CSV: 136 alleen-referentie, 85 ingebouwd en gecontroleerd, 66 procedureel/tijdelijk, 59 aanwezig maar ongebruikt, 31 ontbreekt, 4 niet ontvangen. Dit zijn tellingen van bestanden/onderdelen, **geen voltooiingspercentage**.

## Wat de game technisch doet (bewijs)

- **Steden**: zes kaarten, `src/maps/paris.ts` en `src/maps/cities.ts`. Alleen Parijs heeft `playable: true`; de andere vijf staan op `false` ("Nog niet speelbaar") sinds jouw keuze om eerst Parijs af te maken. Hun kaarten zijn prototypes met drie winkels elk.
- **Modelsysteem**: `public/models/manifest.json` → `src/render/assets.ts`. 45 slots: 11 `final`, 34 `placeholder`. Placeholders zijn GLB-exports van de procedurele figuren/objecten (`tools/make-placeholders.cjs`). Winkelslots `shop.*` zijn gedefinieerd maar niet gevuld (procedureel).
- **Winkels Parijs**: `ShopModule` (`src/render/shopModule.ts`) met echte diepte (4 m interieur), glas, deur, plint, fries, interieur, inrichting, voorraad (instanced), planken, rolluik, puin, roet, en toestanden via `src/render/shopVisualState.ts`. Daarbovenop sinds kort een **platte geschilderde gevel** (`ShopModule.setFacade`) zolang de winkel onaangeroerd is.
- **Winkels overige steden**: `buildStore()`/`updateStoreVisual()` in `src/render/world.ts` + `shopfront.ts`: vier schadestadia gekoppeld aan structuur; **planken en roet worden daar niet getoond** (de spelregels houden ze wel bij).
- **Gebouwen**: Parijs `buildHaussmann()` (instanced gevelmodules op kubusvolumes, alleen straatzijden, mansarddak met dakkapellen en schoorstenen) plus een platte geschilderde gevel boven de winkels (`public/textures/facades/paris_main.jpg`). Overige steden: kubussen met een getegelde canvastextuur (`textures.ts facadeTexture()`), zonder diepte, deuren of daken (gezien in `docs/screenshots/audit/cities.jpg`).
- **Figuren**: 7 final geriggede GLB's (Higgsfield/Meshy, 24 botten, ~7,7k driehoeken, één JPEG-textuur ~0,7 MB). Elk heeft eigen `Idle`; `run`, `push`, `kneel` worden bij het laden gedeeld vanuit `anim.*`-bestanden. Overige rollen zijn placeholders op een eigen 10-gewrichtsskelet met 17 gebakken clips.
- **Effecten**: `src/render/effects.ts` — vuur, rook, vonken, explosie, traangas, blusnevel (`spray`), flare, glas; flipbook-atlassen in `public/fx/`; roet-decal in `ShopModule`; fonteinwater; nat wegdek.
- **Navigatie/colliders**: A*-grid uit kaartrechthoeken en -cirkels (`src/sim/nav.ts`), niet uit meshes. Decor-GLB's en geschilderde gevels hebben geen collider.

## Onafhankelijke toestanden (bewijs uit tests)

Bescherming (planken/rolluik), schade (structuur, glas), voorraad en brand zijn aparte waarden in `src/sim/game.ts` (`structure`, `boards`, `shutterLevel`, `stock`, `scorched`, `fires`). Gedekt door tests in `tests/`:
- "damage and stock are independent", "boards are a protection layer, also over broken glass", "a breached store can still be full".
- "repair restores glass and shutter but never refills stock, and only between waves".
- "firefighter extinguishes; damage and soot remain, stock is not restored", "repeated impacts on one store do not stack fires".

**Afwijkingen (genoteerd, niet gewijzigd):**
1. Overige steden tonen planken en roet niet; alleen vier schadestadia op basis van structuur.
2. Parijs: zodra er íéts verandert (schade, planken, roet, voorraad, rolluik) verdwijnt de geschilderde gevel en verschijnt de 3D-module. Dat is een zichtbare stijlsprong. De states blijven wel onafhankelijk.
3. Winkels hebben geen stabiele winkel-ID (alleen positie in de lijst + `name`/`kind`). Om BLAD, NOORD, KADE, ALDER, VETRO, KANTE en PONTO aan echte winkels te koppelen is eerst een ID-veld nodig (zie C-taken).
4. Herstart van een missie compileert alle shaders opnieuw op een nieuwe renderer: ~37 s in software-rendering (`tools/e2e.cjs` wacht daarom 120 s). Op een echte GPU korter, niet gemeten op een toestel.
5. De browsertest voor plunderaars faalt bij ~4 van 25 seeds (plunderaars verliezen vóór hun eerste buit), ongeacht de laatste wijzigingen.

## Per stad

### Parijs (speelbaar)
| Onderdeel | Status | Bewijs / beperking |
|---|---|---|
| Hoofdgebouw met 3 winkels | procedureel 3D + geschilderde gevel | `haussmann.ts` + `textures/facades/paris_main.jpg`; gevel boven winkels is plat |
| Winkels juwelier/elektronica/mode | procedureel 3D met interieur; intact = platte conceptgevel | `shopModule.ts`; 4 toestanden zichtbaar (gezien: intact en beschadigd) |
| Decorwinkels café/kruidenier/sneakers | procedureel | geen voorraad |
| Zij- en achtergevels, binnenplaatsen | **ontbreekt** | `faceVisible()` bouwt alleen straatzijden |
| Daken | procedureel | mansard met lei/zink, dakkapellen, schoorstenen |
| Straat | procedureel + PBR | waaiervormige kasseien, `setts`-PBR, nat wegdek, lichtstrepen |
| Fontein | final GLB (AI) + procedureel water | `prop.fountain` (14k driehoeken, 1,6 MB) |
| Lantaarns, banken, bomen, paaltjes, hekken, parasols, terrastafels, bushokje | procedureel | `streetProps.ts`, `world.ts` |
| Auto (intact/uitgebrand), bestelbus, inzetbus, politiebus | procedureel | politiebus zonder modelslot |
| Brandweerwagen | **ontbreekt** | |
| Figuren beveiliging/schildteam/brandweer/burger/plunderaars (3) | final rig | schildteam zonder schild; politie-decor gebruikt beveiligingsmodel |
| Vandaal, werper, winkelier, helper, streetwear-varianten | placeholder | |
| Referenties `assets/paris_realism` (6 winkels × 4 toestanden) | alleen PNG-referentie | gebruikt als voorbeeld voor `ShopModule` |

### Amsterdam (vergrendeld; prototype)
- Kaart `AMSTERDAM`: grachten, 2 bruggen, winkels Phones/Jewellery/Fashion; gebouwen stijl `canal` (kubussen met textuur). Visueel gecontroleerd via een testscreenshot (`docs/screenshots/audit/cities.jpg`).
- Ontvangen (ZIP, niet in repo): BLAD intact/boarded/damaged/looted, KADE hoekcafé, NOORD beschadigde winkel (aparte winkel, **geen** stadium van BLAD), fietsenrek, paaltje, koerier — alleen PNG.
- **Niet ontvangen**: de eerdere Amsterdam-uitbreidingsset met brug/kade, afvalcontainer, agent en winkelier (genoemd in `NOG_NODIG.md`).

### Londen (vergrendeld; prototype)
- Kaart `LONDON`: winkelstraat met passage en metrotrap; winkels Department/Phones/Fashion; stijl `brick`.
- Ontvangen: ALDER buurtwinkel, THE LANTERN hoekpub, CIRCUIT beschadigde winkel, bushokje, brandweervrouw, schildagent — alleen PNG. ALDER heeft maar één toestand.

### Milaan (vergrendeld; prototype)
- Kaart `MILAN`: plein met arcade (beloopbaar, kolommen solide — getest); winkels Jewellery/Fashion/Electronics; stijl `italian`.
- Ontvangen: VETRO intact/boarded/damaged/looted, tramhalte — alleen PNG. `arcade_shop.png` en `vetro_intact.png` zijn **identiek** (zelfde hash).

### Berlijn (vergrendeld; prototype)
- Kaart `BERLIN`: binnenplaats via poort (getest: alleen via de poort bereikbaar); winkels Electronics/Fashion/Courtyard jeweller; stijl `berlin`.
- Ontvangen: KANTE binnenplaatspand (één toestand), drie afvalbakken op één beeld — alleen PNG.
- **Niet ontvangen**: KANTE boarded/damaged/looted (genoemd als "geleverd elders").

### São Paulo (vergrendeld; prototype)
- Kaart `SAOPAULO`: voorplein met achterafsteeg en vrachtwagen-route; winkels Sports/Electronics/Fashion; stijl `modern`.
- Ontvangen: PONTO intact/boarded/damaged/looted, bushokje — alleen PNG. `commercial_building.png` = `ponto_intact.png` en `bus_stop.png` = `ponto_bus_stop.png` (zelfde hash).

## Pakketcontrole

17 ZIP's afzonderlijk uitgepakt (`/tmp/audit/zips`, niet in de repo):
- Alle media uit de 12 CITY HOLD-pakketten en het RIOTS-menupakket staan al in de repo (zelfde hash).
- De 5 nieuwe RIOTS-stadspakketten (Amsterdam BLAD, Londen Starter, Milaan/Berlijn/São Paulo, Milaan VETRO, São Paulo PONTO): 30 PNG's, waarvan 3 hash-duplicaten; **nog niet in de repo**.
- Bestanden met dezelfde naam maar andere inhoud: alleen documenten (`README_NL.md`, `START_HERE_FOR_CODE.md`, `manifest.json` per pakket). Geen beelden.
- Geen enkel nieuw pakket bevat GLB's, rigs, animaties, PBR-maps of HDRI's (bevestigd door hun eigen README's en door de inhoud).

## 3D-uitwerking

- **Diepte**: alleen de Parijse winkelmodules hebben echte diepte, ramen, deuren en interieur. Parijse woongebouwen: modules op een volume (balkons, kozijnen als instanced geometrie), geen interieur. Andere steden: platte texturen op kubussen.
- **Platte afbeeldingen in 3D**: de geschilderde hoofdgevel en de drie winkelgevels in Parijs zijn platte vlakken. Ze zien er van voren uit als het concept, maar van opzij plat.
- **Skeletten**: final figuren hebben echte skins (24 botten, 1 skin); placeholders hebben een eigen rig (`rig.ts`). Clips: zie CSV.
- **Schaal/pivot**: figuren 1,70–1,85 m, pivot op de voeten; fontein automatisch geschaald; meters, +Y omhoog, +Z voorzijde.
- **LOD**: `ShopModule` (afstand → voorraad/inrichting verbergen), boomkroon-LOD; figuren en fontein zonder LOD.
- **Hergebruik**: instancing in `haussmann.ts`, `shopModule.ts`, `shopfront.ts`; statische props samengevoegd (`merge.ts`); lichtvlekken/strepen in één mesh.
- **Materialen**: PBR voor kalksteen/kasseien/lei (`public/textures`), HDRI `public/env/blue_hour.hdr` (zelf gegenereerd, geen gelicentieerde HDRI). Final GLB's hebben één ongecomprimeerde JPEG per model; geen KTX2/Draco.

## Wat ik niet heb kunnen testen

- Geen echte telefoon of GPU; alle metingen zijn software-rendering in headless Chromium.
- De vergrendelde steden heb ik alleen in de testbrowser geopend door de kaart in het geheugen tijdelijk speelbaar te maken. Er is daar geen volledige spelronde, opslaan/laden of brand-/blustest gedaan.
- Audio niet beoordeeld.
- Pixelvergelijking met referenties is niet mogelijk; vergelijkingen zijn visueel.
