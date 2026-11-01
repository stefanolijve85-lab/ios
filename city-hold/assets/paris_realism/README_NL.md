# CITY HOLD — Parijs: winkels en realisme

Aanvulling op de bestaande game. Dit pakket bevat 24 nieuwe PNG-bouwreferenties: zes winkeltypen in vier toestanden, plus JSON-configuratie, een JavaScript-hulpmodule en implementatie-instructies.

## Aan Claude/Codex geven

Upload alle delen van dit pakket. Pak ze uit in dezelfde map; elk deel is een zelfstandig ZIP-bestand. Lees eerst START_HERE_FOR_CODE.md. Open CATALOG.html lokaal om alle beelden te vergelijken. De eerdere projectpakketten blijven behouden.

## Wat geleverd is

- Elektronica VOLT, kleding ATELIER, juwelier LUMIERE, buurtwinkel MARCHE, CAFE RIVE en sneakers COURT.
- Per type: intact, dichtgetimmerd, beschadigd en geplunderd.
- manifest.json: bestandskoppelingen, formaten en checksums.
- config/paris_shops.json: afmetingen, kleuren, materiaalrichtwaarden en detailniveaus.
- integration/shopVisualState.mjs: engine-onafhankelijke berekening van zichtbare winkeltoestand.
- docs: bouwhandleiding, kwaliteitsdoelen en lijst met ontbrekende definitieve assets.
- GENERATION_PROMPTS.json: alle gebruikte beeldprompts, gemaakt met ingebouwde beeldgeneratie.

## Grenzen

Dit pakket bevat geen GLB-modellen, rigging, animaties, HDRI of PBR-textuurmaps. De renders hebben ingebakken perspectief en belichting en zijn niet geschikt als naadloze geveltexturen. Ze zijn ook niet pixel-perfect uitgelijnd: architectuur en camera variëren licht tussen beelden. Bouw per winkel één blijvende 3D-shell en wissel losse schadeonderdelen. De opgegeven maten zijn ontwerpkeuzes voor het spel, geen meetgegevens van echte panden.

De huidige gamebroncode is niet onderdeel van dit nieuwe pakket en is hier niet aangepast of op apparaten getest.
