# Opdracht voor de coding agent

Maak de bestaande speelbare CITY HOLD-game realistischer met dit aanvullende Parijse winkelpakket. Werk in de bestaande repository en behoud gameplay, invoer op pc/touch, savegames en de huidige vervangbare assetarchitectuur.

1. Lees de projectinstructies en ASSETS_TODO.md van de huidige repository. Bekijk CATALOG.html en de zes intacte referenties voordat je geometrie wijzigt.
2. Lees manifest.json, config/paris_shops.json en docs/3D_BUILD_SPEC.md. Pas het gegevensformaat aan de bestaande engine aan; installeer geen tweede renderer.
3. Bouw eerst VOLT als echte geometrie: verzonken ramen, kaders, plint, winkelruimte, producttafels, deur en cornice. Gebruik de PNG als bouwreferentie, niet als billboard op een gevel. Vergelijk dichtbij en vanaf de gameplaycamera.
4. Voeg de andere vijf winkelontwerpen toe via configuratie en gedeelde bouwonderdelen. Behoud per winkel alle posities bij schadeovergangen. Verander geen complete gevel omdat de referentiebeelden kleine verschillen bevatten.
5. Koppel de zichtbaarheid van glas, planken, puin en voorraad aan de bestaande spelstatus. integration/shopVisualState.mjs is een los hulppatroon, geen reeds aangesloten gamecode. Voorraad en schade blijven onafhankelijke waarden.
6. Houd alle buit-ID's en de bestaande boekhouding intact: winkelvoorraad → gedragen → gevallen → teruggebracht of ontsnapt. Lege schappen ontstaan door voorraadwijzigingen, niet door een puur visuele schadedrempel. Herstel van ramen vult geen voorraad aan.
7. Gebruik seed-gebaseerde variatie voor producten en puin; geen nieuwe random geometrie iedere frame. Houd winkelentrees en looproutes vrij. Decoratief glaspuin heeft geen individuele physicsbody nodig.
8. Voeg kwaliteitsstanden en een showroom/debugscherm toe: zes winkels naast elkaar, instelbare schade, voorraad en barricade. Geen debugbediening in de normale spelersinterface.
9. Controleer laden, ontbrekende bestanden, schadeovergangen, voorraadherstel en de bestaande tests. Meet frame-tijden op werkelijk beschikbare apparaten; rapporteer welke apparaten wel en niet getest zijn. Gebruik docs/QUALITY_AND_ACCEPTANCE.md.
10. Lever de aangepaste speelbare versie op, met screenshots vanuit dezelfde camera voor en na, meetresultaten en een bijgewerkte ASSETS_TODO.md. Meld eerlijk welke modellen/materialen nog procedureel zijn.

Voer het werk uit. Stop niet bij een plan of nieuwe lijst met benodigde bestanden wanneer procedurele geometrie de volgende stap mogelijk maakt. Dit pakket is aanvullend en vervangt geen bestaande gameplaycode of definitieve 3D-assets.
