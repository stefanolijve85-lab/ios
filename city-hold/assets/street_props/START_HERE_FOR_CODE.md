# CITY HOLD — straatobjecten

Aanvullend op het bestaande Parijse winkelpakket. Bekijk eerst alle acht PNG's en manifest.json. De beelden zijn gemaakt met ingebouwde beeldgeneratie; de volledige prompts zitten in GENERATION_PROMPTS.json.

## Uit te voeren opdracht

Werk verder in de bestaande game en engine. Voeg de acht objecttypen uit dit pakket toe als echte procedurele 3D-objecten, met vervangbare assetadapters voor latere GLB-modellen. Gebruik de beelden voor silhouet, materiaal en detaillering. Gebruik ze niet als platte billboards voor objecten die dichtbij of vanuit meerdere hoeken zichtbaar zijn.

De huidige speelbare code is hier niet meegeleverd of gewijzigd. Behoud routes, upgrades, camera, touchbediening, voortgang en bestaande spelregels. Verwerk dit pakket na de wijzigingen waar je nu aan werkt, zodat gelijktijdige veranderingen niet over elkaar heen schrijven.

1. Fontein: basin en pilaren uit segmenten/gedraaide profielen, water als aparte mesh met beperkte animatie. Geen physics per druppel. Houd de waterstroom binnen het bassin.
2. Lantaarn: profielvormige voet en paal, eigen lanternmesh met emissive materiaal. Hergebruik geometrie; niet iedere lantaarn krijgt een dynamisch schaduwlicht.
3. Bank: echte latten, poten en armleuningen. Gebruik gedeelde materialen en een eenvoudige collider.
4. Boom/plantenbak: box/panelen voor de bak, taps toelopende stam en vertakte kroon; maak LOD voor bladclusters. De referentie-PNG is geen losse bladertextuur. Botsing op bak/stam, niet op de hele kroon.
5. Bushokje: frames, dak en bank echt modelleren. Glas apart; de afbeelding oogt deels mat, maar gebruik helder glas in de game zodat achterliggende actie leesbaar blijft. Lege reclamepanelen kunnen later fictieve posters krijgen.
6. Dranghek: buizen, voeten en snap-punten. Alleen functioneel routeblokkerend maken als de bestaande plaatsingsregels dat toestaan. Controleer dat altijd een geldige route overblijft.
7. Cameramast: basis, stempels, mast, kast en cameras apart. Roteer alleen aangewezen camera-pivots. Bestaande gameplay bepaalt detectiebereik en kosten, de illustratie bepaalt geen spelbalans.
8. Bestelbus: gesloten carrosserie, afzonderlijke wielen, spiegels, ramen, koplampen en deuren. Behoud generieke onbedrukte vorm. Standaard decoratief; maak geen nieuwe rijdende logistiek zonder bestaande gameplaykoppeling.

## Schaal en plaatsing

Maten in manifest zijn ontwerpdoelen, geen nauwkeurige metingen uit afbeeldingen. Y omhoog, voorkant +Z, pivot op grond in het midden. Adapter vertaalt naar bestaande engine. De bestelbus is langer langs Z dan X. Zet objecten op de grond zonder zweven. Vermijd dubbele stoepen of ingebakken vloerschaduwen. Gebruik collisionvoorstellen als startpunt en stem ze af op werkelijke meshes en agentafmetingen.

Plaats lantaarns en banken aan de straatrand, geen objecten voor winkeldeuren. Gebruik de fontein als centraal oriëntatiepunt en houd een vrije ring eromheen. Geef bomen en het bushokje zichtbaarheidsculling of fade wanneer ze speelactie bedekken; verwijder daardoor geen colliders. Kies vaste seeds voor kleur/slijtage en plaatsing. Geen willekeur per frame.

## Kwaliteit en verificatie

Begin met silhouette en schaal, daarna materiaal en detaillering. Maak mobiele en desktop-LOD's. Startbudget per object dichtbij: eenvoudig straatmeubilair 500–3000 driehoeken, bus/fontein 8000–15000; dit zijn voorstellen, geen gemeten prestaties. Houd het totale framebudget uit de game leidend. Deel meshes/materialen en beperk transparante lagen van glas, water en bladeren.

Controleer objecten dichtbij en bij gameplayzoom. Test doorgangen, navigatie na plaatsing/verwijdering van hekken, save/reload, kwaliteitswissel en besturing op pc/touch. Rapporteer werkelijk geteste apparaten en gemeten frame-tijden. Lever de aangepaste speelbare versie en werk ASSETS_TODO.md bij. Stop niet bij een plan wanneer procedurele geometrie uitvoerbaar is.

## Niet inbegrepen

Acht transparante PNG-bouwreferenties zijn geleverd. Geen GLB, rigging, animatieclips, HDRI of PBR-mapsets. PNG's kunnen zachte lichtgloed/alpha aan randen bevatten; gebruik ze als referenties of interfacebeelden, niet als materiaal-albedo. De dimensies en verborgen achterkanten moeten door de modelbouwer worden bepaald.
