# Casa Amoray: website

Mobile-first website voor **Casa Amoray** (Emmen): postpartummassage en ontspanningsmassage,
speciaal voor vrouwen en moeders. De homepage is een filmische **video-scrollytelling**: tijdens
het scrollen beweegt de bezoekster door de salon. Omlaag scrollen speelt vooruit, omhoog terug.

```bash
cd casa-amoray
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

> Deze app staat in een eigen map naast de bestaande verlichtingsapp in deze repository en
> verandert daar niets aan. Op Vercel: nieuw project, **Root Directory = `casa-amoray`**.

---

## 1. Analyse van de bestaande codebase

- In deze repository (en in de andere repositories van het account) stond **nog geen
  Casa Amoray-website**: de root bevat een Next.js 14-verlichtingsapp (Hue/Tuya). Er was dus ook
  **geen boekingssysteem**.
- **Behouden:** de stack (Next.js 14 App Router, React 18, TypeScript, zonder CSS-framework),
  de Vercel-werkwijze en de structuur met API-routes. De verlichtingsapp blijft ongewijzigd
  (alleen `casa-amoray` is uitgesloten in de root-`tsconfig.json`).
- **Aangeleverde beelden** (logo, monogram, ster en vier AI-mock-ups) staan in `reference/` en
  zijn gebruikt voor tijdelijke beelden en logobestanden.

## 2. Technisch plan

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Framework | Next.js 14 (zelfde als bestaande repo) | Statische pagina's + één API-route voor reserveringen |
| Scrollbesturing | **GSAP ScrollTrigger** (`scrub`) | Nauwkeurig voor- en achteruit, lichte smoothing |
| "Vastzetten" van scènes | **CSS `position: sticky`** in plaats van GSAP-pinning | Stabieler op iOS Safari (geen sprongen bij de adresbalk) |
| Video | **Beeldreeksen (WebP) op `<canvas>`** | `video.currentTime` scrubben hapert op iOS; frames zijn exact |
| Mobiel vs. desktop | Aparte reeksen: 9:16 en 16:9 | Niet uitrekken; eigen compositie per scherm |
| Laden | Pas na `load` + idle, alleen voor scènes binnen ±1,5 scherm; ver weg = geheugen vrijgeven | Hero (LCP) eerst, zuinig met geheugen op mobiel |
| Teken-loop | `requestAnimationFrame`, alleen tekenen als het frame verandert; dichtstbijzijnde geladen frame tijdens het laden | Soepel, ook op trage verbinding |
| Minder beweging | `prefers-reduced-motion` → **GSAP wordt niet eens geladen**, statische opmaak | Volwaardige statische ervaring |
| Zonder JS / video faalt | Standaard-HTML = statisch beeld + tekst; JS verrijkt pas daarna | Altijd bruikbaar |
| Overgangen | Scènes overlappen een halve schermhoogte (`OVERLAP`): beide staan stil en de nieuwe vloeit over de oude heen | Filmisch, zonder harde "schuif"-beweging |
| Camerapaden | Per scène sleutelposities (`camera` in `scenes.ts`) zolang er nog geen clip is | Storyboardbeweging nu al voelbaar; later 1-op-1 vervangen door frames |
| Fonts | Cormorant Garamond (koppen) + Manrope (tekst) via `next/font` (zelf gehost) | Geen layout-verspringing, geen externe requests |

### Opbouw

```
src/content/site.ts           bedrijfsgegevens, behandelingen (incl. headspa "Binnenkort"), navigatie
src/content/scenes.ts         het storyboard: scènes, teksten en welk beeld per scène
src/content/media-manifest.json  gegenereerd: beeldreeksen per scène (aantal frames, pad, versie)
src/lib/FrameSequence.ts      canvas-engine voor beeldreeksen
src/lib/gsap.ts               laadt GSAP/ScrollTrigger alleen in de browser en alleen bij beweging
src/components/Hero.tsx       scène 1
src/components/scrolly/SceneStage.tsx   scènes 2–6
src/components/Sections.tsx   scènes 7–9: behandelingen, Over Winnie, cadeaubon/contact, reserveren
src/components/BookingForm.tsx + src/app/api/reservering/route.ts   reserveringsaanvraag
scripts/video-to-frames.sh    Higgsfield-clip → geoptimaliseerde frames + manifest
scripts/make-placeholders.py  maakt de huidige tijdelijke beelden uit reference/
docs/STORYBOARD-HIGGSFIELD.md storyboard + prompts
```

## 3. Definitieve beelden inwisselen

Zie **`docs/STORYBOARD-HIGGSFIELD.md`**. Kort samengevat:

```bash
npm run frames -- clip-9x16.mp4 welkom mobile
npm run frames -- clip-16x9.mp4 welkom desktop
```

Daarna in `src/content/scenes.ts` voor die scène: `media: { kind: "sequence", id: "welkom" }`
en de `placeholder`-regel weghalen. Er hoeft geen code te veranderen.
Nu is alleen scène 02 (`binnenkomst`) al een echte beeldreeks (de proefscène). Scènes 03–06
gebruiken een still met een scrollgestuurd **camerapad** (sleutelposities in `scenes.ts`) tot hun
clip klaar is.

### De klantreis (fase 6)

| Scène | Duur (scherm) | Beeld nu | Camera | Overgang naar volgende |
|---|---|---|---|---|
| 01 Uitnodiging | 2,0 | still (= frame 1 van 02) | stil; tekst trekt weg | naadloos: zelfde beeld |
| 02 Binnenkomst | 2,8 | **beeldreeks** | dolly de salon in | dissolve |
| 03 Het welkom | 2,8 | still | dolly naar tafeltje, boog rechts | dissolve |
| 04 Massageruimte | 2,6 | still | zijwaartse track | dissolve |
| 05 Behandeling | 2,8 | still | trage push-in op handen | dissolve |
| 06 Na afloop | 3,2 | still | trekt terug en komt tot rust | crème vel met behandelingen schuift eroverheen |

Koppen verschijnen woord voor woord, gekoppeld aan het scrollen. Een dunne roze lijn onder de
navigatie toont de voortgang door de beleving. Behandelkaarten en blokken komen rustig in beeld.
"De beleving" in het menu springt naar het moment dat scène 02 volledig in beeld is.

Alle tijdelijke onderdelen tonen het label **"Tijdelijk"**. Zet `showPlaceholderLabels` in
`src/content/site.ts` op `false` als alles is vervangen.

## 4. Reserveren

Er bestond nog geen boekingssysteem. Er worden **geen tijdsloten verzonnen** en er is **geen
schijnbevestiging**:

- De bezoekster kiest een behandeling, voorkeursdatum, optioneel een tijd, en vult haar gegevens
  in. Het is een **aanvraag**; Winnie bevestigt persoonlijk.
- De aanvraag wordt per e-mail naar Winnie gestuurd via [Resend](https://resend.com). Zet daarvoor:
  ```
  RESEND_API_KEY=...
  BOOKING_EMAIL_TO=adres-van-winnie@...
  BOOKING_EMAIL_FROM="Casa Amoray <reserveren@jouwdomein.nl>"
  NEXT_PUBLIC_SITE_URL=https://jouwdomein.nl
  ```
  **Zonder deze instellingen wordt niets verstuurd**, en de bezoekster ziet dat eerlijk.
- **Advies voor later**, zodra de vaste avonden bekend zijn: een salonagenda zoals Salonized of
  Treatwell (echte beschikbaarheid, herinneringen, eventueel aanbetaling). Zet dan
  `NEXT_PUBLIC_BOOKING_URL` en de reserveringspagina toont die knop bovenaan; het formulier blijft
  als terugvaloptie.

## 5. Nog aan te leveren (niet verzonnen)

- Persoonlijke tekst van Winnie (scène 8); de foto is binnen
- Adres, telefoon, e-mail, KvK, Instagram (`src/content/site.ts`)
- Vaste avonden/tijden
- Hoe cadeaubonnen besteld/betaald worden
- Domeinnaam
- Controle van de privacyverklaring (`/privacy`) en van de voorzorgstekst bij de behandelingen
- Definitieve Higgsfield-clips (zie storyboard)

## 6. Getest

- Productiebuild (`npm run build`) en TypeScript zonder fouten.
- Playwright (Chromium) met iPhone 13-emulatie: scrubben vooruit en terug, juiste frames,
  geen horizontale scroll, geen console-fouten, menu, verminderde beweging (statisch, geen
  frames geladen) en desktop 1440×900.
- Fase 6: volledige scroll door de klantreis op iPhone 13-emulatie: mediane frametijd 16,7 ms
  (60 fps), geen dubbele teksten in overgangen, terugscrollen correct, ankerlinks correct;
  verminderde beweging toont alles statisch en zichtbaar; desktop 1440×900 gecontroleerd.
- **Nog te doen:** test op een echte iPhone (Safari) en een Android-toestel. Dat kon in deze
  omgeving niet; WebKit-emulatie is geen vervanging.
