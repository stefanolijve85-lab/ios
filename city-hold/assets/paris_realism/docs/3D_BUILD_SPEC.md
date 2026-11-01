# 3D-bouwspecificatie — ontwerpkeuzes

## Coördinaten en schaal

Gebruik meters; vertaal naar de bestaande engineconventie bij de assetadapter. Voor deze specificatie is Y omhoog en kijkt de gevel naar +Z. Pivot: midden van de voordeur op trottoirniveau. Een winkelmodule: 8 m breed, 4,5 m hoog, interieur 4 m diep achter de gevel. Voorgevel op Z=0; achterwand op Z=-4. Trottoir is onderdeel van de map, geen dubbel vloersegment uit elk winkelmodel. De drie gevelvakken blijven vast op hun plek.

## Geometrie voor zichtbaar realisme

- Steenkader 0,25 m dik; raamneggen 0,18–0,25 m diep. Geen ramen op exact hetzelfde vlak als het steen.
- Centrale deur circa 1,4 m vrije breedte, minstens 2,4 m hoog; entree 0,3 m terug. Stem collision en navigatie op de bestaande agentbreedte af.
- Linker/rechter etalage elk circa 2,6 m breed; lage dichte plint 0,45 m. Bovenlicht en winkelfries blijven zichtbaar.
- Plaats binnen vloer, zijwanden, plafond en achterwand. Producten staan 0,5–3,5 m achter het glas. Gebruik diepte en silhouetten, geen foto van een complete winkel als achterwand dichtbij.
- Kroonlijst met meerdere profielen, pilasters met basis/kapiteel. Bovenliggende gevel is een apart moduledeel met echte raamneggen en balkonvloer, balustrade en dakrand.
- Bouw winkelnaam als afzonderlijk bord met leesbare letters. Merken zijn fictief. Geen onbedoelde tekst uit de render als labels overnemen.
- Voeg kleine bevels aan zichtbare hoeken toe. Reserveer fijn detail voor de gameplaycamera en nabije LOD.

## Interieurs per type

VOLT: twee displaytafels, wandrekken, dozen en screens. ATELIER: kledingrails, twee mannequins, vouwtafel. LUMIERE: vitrines, balie en kleine sieradenhouders. MARCHE: schappen, fruitkratten en kassa. CAFE RIVE: bar, koffiemachine, tafels en stoelen; voor spelvoorraad eigen goederen gebruiken, geen stoelen automatisch als buit tellen. COURT: schoenenwand, zitbank en stapels schoenendozen.

## Meshgroepen en vervangbare GLB-contracten

Maak benoemde groepen: shell, interior, fixtures, stock, glass_intact, glass_broken, boards, shutter_intact, shutter_bent, debris, damage_decals. Houd shell en fixtures dezelfde transform. Voeg sockets toe: entrance, pickup_01..06, sign, light_left, light_right. Gebruik afzonderlijke colliderdata en spawnpunten in de assetadapter. Referenties zijn geen gemeten plattegronden; config is leidend bij tegenspraak.

## Schade en voorraad

Intact: heel glas. Boarded: zichtbare planken als beschermingslaag, niet automatisch schade. Damaged: glas ontbreekt deels, rolluik verbogen, lokaal puin; voorraad kan nog volledig zijn. Looted: gekraakte winkel met nauwelijks voorraad. Ook een lege intacte winkel en een beschadigde volle winkel moeten technisch mogelijk blijven. De vier beelden zijn voorbeelden, geen verplichte lineaire state machine. Spelwaarden bepalen effect; visuele helper schrijft nooit naar voorraad of collision.

Laat glasbreuk één keer een kort effect starten, daarna statische shards tonen. Houd plankgezondheid apart van gebouwschade. Laat gebroken glas alleen op passende raamranden zien, geen zwevende driehoeken midden in een opening. Instantieer puin met vaste seed en begrens aantallen.

## Materialen en licht

Maak fysiek verschillende oppervlakken: matte kalksteen, gelakt hout/metaal, messing, glas, karton en natte bestrating. Gebruik configwaarden als startpunt en tune onder één vaste belichting. Renders bevatten licht en schaduw; gebruik ze niet als albedo of normal-map.

Blauwuur is een kunstkeuze: koele omgeving en warme interieurs. Bewaar leesbare gezichten en navigatie. Beperk bloom en spiegelende straten; natheid vooral in voegen en plassen. Gebruik emissive winkellichten zonder voor elke lamp een schaduwgevende dynamische lichtbron te maken. HDRI en echte PBR-maps zijn nog niet geleverd.
