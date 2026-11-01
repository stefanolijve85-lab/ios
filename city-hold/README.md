# CITY HOLD — project handoff

Dit project bevat alle creatieve input om CITY HOLD te bouwen: 40 PNG-afbeeldingen, een gameplaymock-up van 28 seconden en de uitgebreide spelbeschrijving. Er is nog geen speelbare gamecode aanwezig.

## Aan Claude Code / Codex geven

Pak de ZIP uit en open de map `CITY_HOLD_Project` als werkmap. Geef de coding-agent deze opdracht:

> Lees START_HERE_FOR_CODING_AGENT.md en docs/GAME_DESIGN.md. Inspecteer de lokale assets en gameplayreferentie. Bouw vervolgens de eerste werkelijk speelbare versie van CITY HOLD en ga daarna verder met de andere steden volgens de beschreven fasering. Gebruik de beelden als visuele referentie, niet als een stilstaande achtergrond met nepbediening.

## Inhoud

- `assets/maps/`: schone en beschadigde stadsconcepten.
- `assets/units/`: personages en ondersteunende eenheden.
- `assets/props/`: voertuigen, cameramast en barrières.
- `assets/action_references/`: zes posebladen, elk met vier actieposes.
- `assets/manifest.json`: exacte bestandsnamen, maten, rollen en controlehashes.
- `references/gameplay_mockup_28s.mp4`: gescripte ontwerpdemonstratie, geen opname van een functionerende game.
- `docs/GAME_DESIGN.md`: uitgebreide regels, economie, facties, steden, upgrades en acceptatiecriteria.
- `docs/ASSET_GUIDE.md`: gebruik en beperkingen van de referenties.
- `START_HERE_FOR_CODING_AGENT.md`: concrete bouwopdracht en fasering.
- `tools/render_reference_demo.py`: bron van de ontwerpvideo; dit is geen spelengine.

De bestaande mapnamen en bestandsnamen zijn onderdeel van de overdracht. De afbeeldingen zijn PNG-rasterbestanden: er zijn geen 3D-modellen, rigs of afgewerkte loopanimaties meegeleverd. De opdracht is gericht op een 3D-spel; de coding-agent moet de scène en bewegende eenheden opbouwen.
