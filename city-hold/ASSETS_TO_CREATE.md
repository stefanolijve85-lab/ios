# RIOTS — assets die nog gemaakt moeten worden

Gebaseerd op `ASSET_AUDIT.md` en `ASSET_INVENTORY.csv` (peildatum 1 november 2026). Indeling:

- **A** — nieuwe beeldreferenties die jullie kunnen genereren (PNG).
- **B** — echte 3D-modellen, rigs, animaties en materialen (GLB/PBR).
- **C** — integratie- of codewerk zonder nieuw beeld.

Conventies voor alle B-assets: GLB 2.0, meters, +Y omhoog, +Z voorzijde, pivot op grondniveau (midden onder), materiaalnamen beschrijvend, texturen max. 2048 px (figuren 1024), bij voorkeur KTX2/WebP-texturen. Sjablonen staan al in `assets/model_templates/`.

## Gedeeld (alle steden)

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | B | Animatieset op het 24-bot Meshy-skelet: walk, carry_idle, carry_walk, pickup, throw (lege hand), block/brace, push, escorted, extinguish, guide, flee | nu vervangen door run/idle; in de bestaande `anim.*`-route te laden |
| P1 | B | Schildteam met losse schild-prop (rechterhand-socket) | `char.shield` heeft nu geen schild |
| P1 | B | Werper en vandaal, final, met `hand_socket`-bot | `char.thrower`, `char.vandal` zijn placeholders |
| P1 | B | Winkelier en helper (hesje), final | `char.shopkeeper`, `char.helper` placeholders |
| P2 | B | Politieagent (onderscheidbaar van private beveiliging) | decor-politie gebruikt nu het beveiligingsmodel |
| P2 | B | Politiebus GLB, bestelbus beschadigd/uitgebrand, brandweerwagen | nu procedureel of ontbrekend |
| P2 | B | Stof-effect (flipbook) | ontbreekt |
| P2 | A+B | Naadloze PBR-sets: baksteen (Amsterdam/Londen), stuc (Milaan), pleister (Berlijn), beton (São Paulo), nat asfalt | alleen Parijs heeft PBR |
| P3 | B | LOD's voor figuren en fontein; gecomprimeerde texturen | prestaties mobiel |

## Parijs

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | B | Winkelmodules juwelier/elektronica/mode als GLB met benoemde groepen (`shell`, `glass_intact`, `glass_broken`, `boards`, `shutter`, `stock`, `fixtures`, `debris`) | vervangt de platte gevel en de procedurele pui, zonder stijlsprong; spec in `assets/paris_realism/docs/3D_BUILD_SPEC.md` |
| P1 | B | Haussmann-gevelmodule (3 verdiepingen + mansard) en hoekpand, plus zij-/achtergevel | nu instanced blokmodules + platte gevel |
| P2 | B | Brandweerwagen | nog nergens in de game |
| P3 | A | Extra burger-outfits, cafégasten zittend | |

## Amsterdam

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | B | BLAD trapgevelpand als één GLB met losse toestandsdelen (glas, deur, planken, voorraad, puin) | referenties: canal_shop + blad_boarded/damaged/looted |
| P2 | B | KADE hoekcafé en NOORD-winkel GLB | NOORD is een aparte winkel |
| P2 | A | NOORD intact/boarded/looted; KADE vier toestanden | nu alleen NOORD beschadigd en KADE intact |
| P2 | B | Fietsenrek, paaltje (XXX), grachtenleuning, brug/kade-delen | |
| — | A | Ontbrekende tweede set (brug/kade, afvalcontainer, agent, winkelier) | **niet ontvangen** — opnieuw aanleveren |

## Londen

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | A | ALDER boarded/damaged/looted | alleen intact geleverd |
| P1 | B | ALDER winkel-GLB met toestandsdelen | |
| P2 | B | THE LANTERN hoekpub (twee gevels, hoekdeur), CIRCUIT | |
| P2 | B | Rood bushokje (frame, glas, bank los) | |
| P2 | B | Brandweervrouw en schildagent (Londense outfit) op het gedeelde rig | |

## Milaan

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | B | VETRO arcadepand GLB met beloopbare arcade en toestandsdelen | vier toestanden als referentie aanwezig |
| P2 | B | Groene historische tramhalte | |
| P2 | A | Tweede en derde winkel voor de kaart (mode/juwelier) | kaart heeft drie winkels |

## Berlijn

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | A | KANTE boarded/damaged/looted | **niet ontvangen** — opnieuw aanleveren |
| P1 | B | KANTE binnenplaatspand met echte poortopening | kaart gebruikt de poort als route |
| P2 | B | Afvalbak-basismodel met drie dekselkleuren | |

## São Paulo

| Prio | Type | Asset | Opmerking |
|---|---|---|---|
| P1 | B | PONTO hoekgebouw GLB (twee winkelgevels, vinnen, airco's) met toestandsdelen | vier toestanden als referentie |
| P2 | B | Bushokje (frame/glas/bank los), palmboom-asset | |
| P2 | A | Sports- en mode-winkel voor de kaart | kaart heeft drie winkels |

## C — integratie- en codewerk (geen nieuw beeld nodig)

1. Stabiele winkel-ID's in `StoreDef` (bijv. `id: 'blad'`) en koppeling referentie ↔ winkel; savekey ongewijzigd laten.
2. `ShopModule`-toestandssysteem (planken, roet, glas, voorraad) ook gebruiken in de andere vijf steden.
3. Eén renderer hergebruiken tussen missies, zodat een herstart niet alle shaders opnieuw compileert (~37 s in software-rendering).
4. Overgang tussen geschilderde gevel en 3D-module in Parijs verzachten, of de gevel vervangen zodra B-modules er zijn.
5. Hand-socket en draagpunt koppelen aan de juiste botten van het Meshy-rig (nu hangt de buit-doos vast aan het lichaam, niet aan de armen).
6. Texturen comprimeren (KTX2) en het totale downloadgewicht meten (nu ~10 MB aan final modellen).
7. Nieuwe ZIP-referenties in de repo opnemen (`assets/cities/<stad>/`), met duplicaten maar één keer.
8. Browsertest voor plunderaars robuuster maken (faalt bij ~4 van 25 seeds).

## Volgende batch: de tien belangrijkste

| # | Asset (ID) | Stad | Waarom | Formaat | Aanzichten/varianten/animaties | Schaal/pivot/materiaal | Hergebruik |
|---|---|---|---|---|---|---|---|
| 1 | Animatieset voor `char.*` (24-bot rig) | alle | elke figuur loopt/draagt/gooit nu met vervangende clips | GLB alleen animaties (zoals `anim.run`) | walk, carry_idle, carry_walk, pickup, throw, block, escorted, extinguish, guide, flee; in-place, 30 fps, loop waar nodig | zelfde skelet en botnamen als `char.security` | ja: gedeeld via `shareCharacterClips()` |
| 2 | `char.shield` + schild-prop | alle | schildteam is een kerneenheid en heeft geen schild | GLB geriggede figuur + losse schild-GLB | voor/zij/achter referentie; idle, walk, block | 1,8 m, pivot voeten; schild ~0,6×1,1 m, pivot handgreep | rig en animaties van #1 |
| 3 | `char.thrower` met `hand_socket` | alle | werper-animatie moet object in de hand tonen | GLB geriggede figuur | throw met release-moment (event of vaste fractie 0,45) | socket-bot aan rechterhand | rig en animaties van #1 |
| 4 | `shop.jewelry` / `shop.electronics` / `shop.fashion` modules | Parijs | grootste visuele gat: platte gevel ↔ 3D-pui | GLB per winkel met benoemde groepen | intact, boarded, damaged, looted als losse delen in één bestand | breedte 8 m + pilasters, hoogte 4,45 m tot kroonlijst, diepte 4 m; pivot midden onderkant voorzijde | groepsnamen volgens `assets/paris_realism/docs/3D_BUILD_SPEC.md` |
| 5 | `char.shopkeeper`, `char.helper` | alle | neutrale figuren nu procedureel | GLB geriggede figuren | idle, walk, flee, guide (helper) | 1,7–1,8 m | rig van #1 |
| 6 | Haussmann gevel-/hoekmodule | Parijs | zij- en achtergevels zijn nu leeg of blok | GLB modulair (raamtravee, hoek, mansardstuk) | 1 travee 2 m breed × 3,2 m per verdieping | instancing-vriendelijk, één materiaalatlas | vervangt `haussmann.ts`-modules |
| 7 | BLAD-pand | Amsterdam | eerste winkel voor de volgende stad, vier referenties aanwezig | GLB met toestandsdelen | intact/boarded/damaged/looted als delen | ~6 m breed, trapgevel; pivot voorzijde midden | interieurmodules uit #4 |
| 8 | KANTE boarded/damaged/looted | Berlijn | referentie niet ontvangen | PNG (A) | zelfde camera en pand als `courtyard_building.png` | — | — |
| 9 | `char.police` + politiebus-GLB | alle | onderscheid politie ↔ beveiliging; bus nu procedureel | GLB figuur en voertuig | figuur: idle, walk, block; bus: 2 schadestadia | bus ~5,2×2,0 m, zwaailicht als apart materiaal `beacon` | rig van #1 |
| 10 | Naadloze PBR-sets baksteen/stuc/pleister/beton | Amsterdam, Londen, Milaan, Berlijn, São Paulo | nodig voordat gebouwen van die steden 3D kunnen worden | albedo/normal/roughness 2048², tileable | per materiaal 1 set + vuile variant | 1 tegel = 2×2 m | `pbr.ts` laadt sets al |

## Wat als eerste aanleveren

1. **Animatieset (#1)** op het skelet van jullie huidige figuren — dat verbetert alle zeven bestaande modellen in één keer.
2. **Schildteam met schild (#2)** en **werper met hand-socket (#3)**.
3. **De drie Parijse winkelmodules (#4)** — daarmee verdwijnen de platte gevels in Parijs.
