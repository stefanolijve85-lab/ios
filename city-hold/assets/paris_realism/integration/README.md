# Hulpmodule aansluiten

Importeer getShopVisualState en visibleStockCount uit shopVisualState.mjs in de bestaande assetadapter. Alle inputs zijn genormaliseerd 0..1; damage=1 is volledig beschadigd, boardHealth=0 betekent geen actieve planken. breach kan een reeds opengebroken winkel markeren onafhankelijk van damage. Drempels 0,35/0,6 en 10% voorraad zijn voorgestelde visuele startwaarden, geen definitieve spelbalans.

Pas groups toe op de gelijknamige scenegroepen na bestaande gamestate-events. Laat de inventarisadministratie de stockRatio berekenen. visibleStockCount is alleen voor decoratieve voorraadslots, nooit voor het werkelijke aantal goederen. Gebruik vaste productvolgorde zodat weghalen niet willekeurig flikkert. Resterende glass_broken-groep bestaat alleen uit randfragmenten. referenceState kiest het meest nabije voorbeeldbeeld; de groups bepalen de werkelijke samengestelde toestand, ook bij planken over een kapotte ruit.

Deze module heeft geen Three.js/Godot/Unity-imports en is hier niet op de huidige gamerepository aangesloten. De coding agent past de adapter aan de bestaande engine aan.
