# RIOTS City Expansion 18 — integration report

Source pack: `RIOTS_City_Expansion_18.zip` (six asset sheets, `references/<city>/asset_sheet.png`, manifest with sha256).

## What was done

- Each sheet was split into its three parts (vehicle, street object, character), cropped to the real object bounds with
  a 6 px margin, and saved as transparent PNG under `assets/expansion18/<city>/{vehicle,prop,character}.png`.
  Crop boxes are in `parts.json`.
- Milan: the white background was removed with a flood fill from the sheet border only (near-white, unsaturated
  pixels connected to the edge). White inside the figures stays: the blouse, cups, tray and the ice-cream cart awning
  were checked.
- Rio: the street sweeper's broom and the vending cart overlap in columns. They were separated as connected shapes,
  not by a straight cut.
- Rio is stored as `rio/` here. In the game the city keeps its internal id `saopaulo`, so saved progress is unaffected.

## Status per part

| City | Part | Name | Source | Runtime file | Placed in game | Status |
|---|---|---|---|---|---|---|
| paris | vehicle | Veegwagen | references/paris/asset_sheet.png | assets/expansion18/paris/vehicle.png | no | reference only, needs 3D model |
| paris | prop | Drinkfontein | references/paris/asset_sheet.png | assets/expansion18/paris/prop.png | no | reference only, needs 3D model |
| paris | character | Straatwerker | references/paris/asset_sheet.png | assets/expansion18/paris/character.png | no | reference only, needs rigged model |
| amsterdam | vehicle | Bezorgvoertuig | references/amsterdam/asset_sheet.png | assets/expansion18/amsterdam/vehicle.png | no | reference only, needs 3D model |
| amsterdam | prop | Reddingsboeipost | references/amsterdam/asset_sheet.png | assets/expansion18/amsterdam/prop.png | no | reference only, needs 3D model |
| amsterdam | character | Fietsenmaker | references/amsterdam/asset_sheet.png | assets/expansion18/amsterdam/character.png | no | reference only, needs rigged model |
| london | vehicle | Taxi | references/london/asset_sheet.png | assets/expansion18/london/vehicle.png | no | reference only, needs 3D model |
| london | prop | Straatprullenbak | references/london/asset_sheet.png | assets/expansion18/london/prop.png | no | reference only, needs 3D model |
| london | character | Ambulancehulpverlener | references/london/asset_sheet.png | assets/expansion18/london/character.png | no | reference only, needs rigged model |
| milan | vehicle | Scooter | references/milan/asset_sheet.png | assets/expansion18/milan/vehicle.png | no | cut out; reference only, needs 3D model |
| milan | prop | IJskar | references/milan/asset_sheet.png | assets/expansion18/milan/prop.png | no | cut out; reference only, needs 3D model |
| milan | character | Cafemedewerkster | references/milan/asset_sheet.png | assets/expansion18/milan/character.png | no | cut out; reference only, needs rigged model |
| berlin | vehicle | Gemeentewagen | references/berlin/asset_sheet.png | assets/expansion18/berlin/vehicle.png | no | reference only, needs 3D model |
| berlin | prop | Elektriciteitskast | references/berlin/asset_sheet.png | assets/expansion18/berlin/prop.png | no | reference only, needs 3D model |
| berlin | character | Elektricien | references/berlin/asset_sheet.png | assets/expansion18/berlin/character.png | no | reference only, needs rigged model |
| rio | vehicle | Gele taxi | references/rio/asset_sheet.png | assets/expansion18/rio/vehicle.png | no | reference only, needs 3D model |
| rio | prop | Verkoopkar | references/rio/asset_sheet.png | assets/expansion18/rio/prop.png | no | separated from the sweeper; reference only |
| rio | character | Straatveger | references/rio/asset_sheet.png | assets/expansion18/rio/character.png | no | separated from the cart; reference only, needs rigged model |

## Remaining work

The game is a real 3D scene: a PNG is not a model. Nothing from this pack is placed in the game yet.

- **Vehicles and street objects (12):** convert each cut-out with the existing image-to-3D pipeline (Higgsfield,
  Tripo H3.1, about 9 credits each, about 108 in total). Then register a `prop.*` slot in `public/models/manifest.json`
  and place it per city as decoration: metre scale, ground pivot, a simple collider, kept clear of shop entrances
  and routes.
- **Characters (6):** convert to 3D, then rig with the Meshy rig (about 17 credits each, about 102 in total). They
  become city-exclusive bystanders through the existing passer-by system, playing the existing clips. Carried items
  (broom, tool case, medical bag, tray) need a hand socket. No new abilities.
- The Higgsfield balance is 7.65 credits when this report was written: not enough for one model.
