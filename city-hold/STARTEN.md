# RIOTS — starten (Parijse straat)

Benodigd: Node.js 20 of nieuwer.

```bash
cd city-hold
npm ci
npm run dev
```

Open het adres dat Vite toont (standaard http://localhost:5173). Kies **Defence** of **Looters**, district **Paris**, en druk op **Play**.

## De spelcyclus (linksonder in beeld wordt die afgevinkt)

**Verdediging:** kaart Barrier/Camera aantikken → groene plek aantikken · beveiliger aantikken → grond aantikken om te verplaatsen → **Start wave** → teams onderscheppen plunderaars (buit valt terug naar de winkel) → na de golf +350 → winkellabel aantikken → **Upgrade shutter** of team-/camera-upgrade.

**Plunderaars:** winkel aantikken (doel) → oranje pijl (route) → Runner/Carrier werven → **Dispatch** → plunderen → buit naar de uitgang brengen (+25 per stuk) → **Details & upgrades** → capaciteit of snelheid.

Bediening: slepen = pannen, scrollen/knijpen = zoomen, P = pauze. Instellingen: geluid, minder effecten (sneller op zwakke apparaten), tips.

## Overige commando's
- `npm test` — spelregels, volledige cyclus, routes en controle van de 3D-modelbestanden.
- `npm run build` — statische versie in `dist/`; `npm run preview` om die te bekijken.
- `npm run placeholders` — tijdelijke 3D-modellen opnieuw genereren (dev-server moet draaien; vereist Playwright/Chromium).
- `npm run e2e` — browsertest van de bediening (dev-server moet draaien; vereist Playwright/Chromium).
- `npm run e2e:mobile` — dezelfde cyclus op een nagebootste iPhone met alleen tikken.

**Kwaliteit:** op telefoons staat standaard *Mobile quality* aan (geen reflecties, gloed of schaduwen). Op de pc kun je die in Settings aan- of uitzetten.

Welke definitieve 3D-assets nog ontbreken en hoe je ze aanlevert: zie **ASSETS_TODO.md**.

## Ontwikkelpagina's
- `http://localhost:5173/#showroom` — de zes winkels naast elkaar met schuifjes voor schade, voorraad, planken en kwaliteit, plus de straatobjecten en de fontein.
- `http://localhost:5173/#fxroom` — alle effecten op lichte en donkere ondergrond, met stresstest en pauze.
- `node tools/fx-check.cjs http://localhost:5173/ fx.png mobile` — controleert particlelimiet, pauze en opruimen van brand.

## Hulpmiddelen voor assets (vereisen Python 3 met numpy en Pillow, of Playwright)
- `python3 tools/make_pbr.py` — PBR-texturen (kalksteen, natte kasseien, leisteen) in `public/textures`.
- `python3 tools/make_hdri.py` — blauwuur-HDRI in `public/env`.
- `python3 tools/make_flipbooks.py` — animatie-atlassen voor vuur, rook en gas in `public/fx`.
- `node tools/make-templates.cjs http://localhost:5173/` — GLB-sjablonen voor een 3D-artiest in `assets/model_templates`.
