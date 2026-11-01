# Kwaliteit en acceptatie

Deze waarden zijn startbudgetten, geen behaalde prestaties of garanties. Profileer de huidige engine en verlaag waar nodig. Meet op een benoemd apparaat met browser, resolutie, kwaliteitsstand en representatieve golf.

| Onderdeel | Mobiel startdoel | Desktop startdoel |
|---|---:|---:|
| Framebudget | 33,3 ms (30 fps) | 16,7 ms (60 fps) |
| Pixelratio maximum | 1,5 | 2 |
| Zichtbare driehoeken hele scene | 250.000 | 750.000 |
| Draw calls hele scene | 150 | 300 |
| Dynamische schaduwlichten | 1 | 2 |
| Winkelmodule dichtbij incl. inhoud | 12.000 driehoeken | 30.000 driehoeken |
| Decoratief puin per winkel | 12 instanties | 30 instanties |

LOD op schermgrootte tunen: dichtbij echte interior/kozijnen, middellang vereenvoudigde producten en balkonspijlen, veraf geen losse producten. Verwijder geen zichtbare gameplayobjecten of hun logica wanneer decoratie wordt geculld. Deel materialen en geometrie; laad referentie-PNG's niet allemaal als gametexturen.

Acceptatie:
- Alle zes winkels herkenbaar aan inrichting, silhouet en kleur, ook zonder bordtekst.
- Inzoomen toont echte raamdiepte, zijwanden en productgeometrie; geen vlak met render als gevel.
- Geen z-fighting, zwevende spullen, dubbele trottoirs of glasvlakken achter gebroken openingen.
- Beschadiging verschuift gebouw, deur en navigatie niet.
- Boarded blokkeert alleen doorgang wanneer de spelregels dat aangeven.
- Voorraad 0%, 50%, 100% is zichtbaar zonder extra buit te creëren.
- Oppakken, laten vallen, terugbrengen en ontsnappen kloppen met de bestaande boekhouding.
- De game blijft speelbaar via touch en muis; camerazoom botst niet met knoppen.
- Reload/save bewaart schade, planken, voorraad en seed.
- Geen consolefouten of ontbrekende assets; ontbrekende toekomstige GLB gebruikt bestaande procedurele fallback.
- Test kwaliteitswissel midden in een golf zonder reset van gamegegevens.

Maak screenshots van alle zes winkels bij identieke belichting en camera, plus nabij/midden/ver. Rapporteer gemeten frame-tijd en de niet-gehaalde doelen, geen veronderstelde mobiele prestaties.
