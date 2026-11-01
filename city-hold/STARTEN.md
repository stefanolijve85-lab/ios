# CITY HOLD — starten (Parijse straat)

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

Welke definitieve 3D-assets nog ontbreken en hoe je ze aanlevert: zie **ASSETS_TODO.md**.
