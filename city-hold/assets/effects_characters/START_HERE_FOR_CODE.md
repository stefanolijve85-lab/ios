# CITY HOLD — effecten en ondersteunende figuren

Voeg dit aanvullende pakket toe na je huidige wijzigingen. Lees manifest.json en bekijk de PNG's. Behoud de bestaande engine, gameplay en assetadapter. Er zijn 12 PNG's: vijf effecten, zes personagereferenties en één brandblusser. Geen animatieclips of GLB-modellen.

## Effecten in de bestaande renderer

- Gebruik de vijf effecten als statische alpha-sprites of stijlgids voor shaders. Het zijn geen frame-atlassen of naadloze animatielussen.
- Laat pooled particles groeien, drijven/stijgen en vloeiend verschijnen/verdwijnen met verschillende seeds, tijden en rotaties. Dezelfde explosieafbeelding groot ronddraaien ziet er vlak uit; houd die kort en voeg afzonderlijke rook/vonken toe.
- Gebruik normal alpha voor traangas, donkere rook en de explosie met rookrand. Additive blending voor donkere rook wist donkere delen uit; dat is ongeschikt. Vergelijk bij vuur normal/additive op lichte én donkere achtergronden.
- Gebruik depthTest aan, depthWrite uit voor transparante effectlagen; sorteer waar nodig. Stem premultiplied alpha van texture-upload en blending op elkaar af. Geen zwarte vierkanten of gekleurde halo's op contrasterende achtergronden.
- effect_presets.json bevat voorgestelde startwaarden; ze zijn geen gemeten natuurkunde of definitieve spelbalans. Rate/caps gelden voor decoratieve particles. Verminder emitteraantallen als de schermdekking groot wordt.
- Houd rook onder de UI en laat geselecteerde eenheden en plaatsingsmarkeringen leesbaar. Toon een gebiedsmarkering als een effect spelregels beïnvloedt. Alleen bestaande spellogica bepaalt radius, duur, vertraging en schade, nooit de alpha van een PNG.
- Gebruik één effectevent per spelgebeurtenis; dedupliceer op event-ID zodat explosies niet elke update opnieuw starten. Loopende brand heeft een emitter-ID die stopt bij blussen/verwijderen. Na blussen mag restrook kort uitdoven; laat geen eeuwige emitter achter.
- Explosie is een visueel event, geen nieuw explosieven- of wapensysteem. Voeg geen nieuwe automatische schade toe enkel omdat een effect zichtbaar is.
- Bied een instelling voor minder effecten/cameratrilling. Geen snelle herhaalde beeldvullende flitsen. Beperk cameratrilling tot korte, optionele feedback.
- Recycle particles en materialen; geen groeiende textures of objecten per frame. Pauzeer met de game en clamp grote delta-tijden na tabwissel. Ruim emitters op bij restart/mapwissel.

## Figuren en object

De zes personages zijn brandweer idle, brandweer met slang, schildagent, vluchtende burger, winkelier met doos en begeleider in hesje. Gebruik voor portretten en als bouwreferentie voor bestaande vervangbare 3D-figuren. Niet als platte figuren voor een vrij draaibare camera dichtbij. Een PNG bevat geen skelet; behoud bestaande placeholderanimaties tot echte geriggede modellen beschikbaar zijn. Koppel rollen aan speldata en uitrusting.

Brandweer met slang: maak de nozzle/socket apart; bouw de waterstraal in de engine als lijn/tube of particles naar het bestaande doelpunt. De slangreferentie loopt aan de beeldrand door en specificeert geen volledige slanglengte. De stilstaande brandweerman en brandweerman met slang zijn aparte ontwerpfiguren, geen gegarandeerd identieke animatiestanden van hetzelfde model.

De brandblusser wordt een los 3D-prop met bodem-pivot; doelmaat 0,55 m hoog en circa 0,18 m breed als spelontwerpkeuze. Geen echte bedieningsinstructie. Voor personages is circa 1,75–1,85 m een voorgestelde lichaamslengte exclusief helm, aan te passen aan bestaande schaal.

## Controle en oplevering

Maak een debug-effectshowroom met elk effect op lichte/donkere ondergrond en voor/achter een gebouw. Controleer alpha, diepte, pauze/resume, opruimen, stoppen van brand bij blussen en dalende particlecount na bursts. Stress-test gelijktijdige effecten onder beide kwaliteitsstanden. Meet op beschikbare apparaten en vermeld eerlijk wat niet is getest.

Wijzig niet ongevraagd eenhedenbalans, voorraadtellingen, bestaande routes of saveformaat. Lever de bijgewerkte speelbare versie met screenshots en de resterende GLB/animatiebehoefte. Dit pakket is hier gecontroleerd op PNG-bestanden en ZIP-integriteit, niet in de huidige game geïntegreerd.
