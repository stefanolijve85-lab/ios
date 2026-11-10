# Bij Tanja: website

Website voor **Bij Tanja: kaas, noten & meer**, in Winkelcentrum Angelslo, Emmen.
Gebouwd met Next.js (App Router), TypeScript, Tailwind CSS en Framer Motion.

```bash
cd bij-tanja
npm install
npm run dev        # http://localhost:3000
npm run build      # productie-build
npm start          # productieserver
```

---

## 1. Winkelgegevens aanpassen

Alles staat in **`src/content/`**:

| Bestand | Wat staat erin |
|---|---|
| `winkel.ts` | naam, slogan, adres, telefoon, WhatsApp, e-mail, openingstijden, social media |
| `teksten.ts` | alle grote teksten van de homepage (hero, kaas, borrel, cadeau, Tanja, …) |
| `assortiment.ts` | de 7 categorieën: titel, beschrijving, foto, voorbeelden |
| `borrel.ts` | de keuzes van de borrelplank-inspiratie |
| `fotos.ts` | het fotomanifest (zie hieronder) |

> **Belangrijk:** in `winkel.ts` staan velden die nog op `null` staan omdat ze niet
> bevestigd zijn: **straat + huisnummer, postcode, telefoon, WhatsApp, e-mail,
> openingstijden en social media**. Zolang een veld `null` is, verbergt de website het
> automatisch en komt het niet in de gegevens voor Google. Vul ze in zodra Tanja ze
> heeft bevestigd (bijv. via https://www.angelslo.nl/winkels/bij-tanja).
>
> Zolang de openingstijden leeg zijn, verwijst de site naar de pagina van het winkelcentrum.

Openingstijden invullen gaat zo:

```ts
openingstijden: {
  maandag: "gesloten",
  dinsdag: { open: "09:00", dicht: "18:00" },
  woensdag: { open: "09:00", dicht: "18:00" },
  donderdag: { open: "09:00", dicht: "18:00" },
  vrijdag: { open: "09:00", dicht: "18:00" },
  zaterdag: { open: "09:00", dicht: "17:00" },
  zondag: "gesloten",
},
```

## 2. Foto's toevoegen

1. Zet je originele foto's (JPG, PNG, WebP of HEIC) in **`fotos/origineel/`**.
   Geef ze een duidelijke naam, bijv. `kaasplank-kerst.jpg`.
2. Draai:
   ```bash
   npm run fotos
   ```
   Het script draait de foto's rechtop, haalt locatiegegevens (GPS) eruit, verkleint ze
   naar webformaat in `public/fotos/bij-tanja/` en maakt een blur-preview. De originelen
   blijven ongewijzigd.
3. Het script laat zien welke foto's nog niet in **`src/content/fotos.ts`** staan. Voeg
   per foto een regel toe:
   ```ts
   {
     bestand: "kaasplank-kerst.jpg",
     categorie: "kaas",          // winkel | tanja | kaas | wijn | bier-sap | noten | snoep | delicatessen | cadeaus
     alt: "Beschrijf wat er echt op de foto te zien is",
     volgorde: 15,                // plek in de galerij
     hero: false,                 // true = geschikt als grote openingsfoto
     bijschrift: "Optioneel tekstje in de galerij",
     focus: "50% 50%",            // welk deel belangrijk is bij bijsnijden
   },
   ```
4. Wil je een foto ergens anders gebruiken (bijv. bij een categorie)? Zet de
   bestandsnaam in `assortiment.ts` of `teksten.ts`.

**HEIC (iPhone):** werkt het script er niet mee, installeer dan eenmalig
`npm i -D heic-convert`, of zet op je iPhone *Instellingen › Camera › Formaten › Meest compatibel*.

Next.js levert de foto's automatisch als AVIF/WebP in het juiste formaat per scherm,
met lazy loading.

## 3. Online zetten (Vercel)

1. Importeer de repository op vercel.com.
2. Zet **Root Directory** op `bij-tanja`.
3. Voeg de omgevingsvariabele `NEXT_PUBLIC_SITE_URL` toe met het echte domein
   (bijv. `https://www.jouwdomein.nl`). Die wordt gebruikt voor de sitemap, Open Graph en Google-gegevens.
4. Deploy.

## 4. Wat zit erin

- **Home**, opgebouwd als wandeling door de winkel: welkom, kom verder (scrollytelling),
  assortiment, de kaasbeleving, borrelinspiratie, cadeaus, kennismaken met Tanja,
  fotogalerij met lichtbak (tikken, swipen, pijltjestoetsen) en "kom gezellig langs".
- **/assortiment**, **/cadeaus**, **/over-tanja**, **/contact**
- Vriendelijke begroeting, één keer per bezoek, passend bij het tijdstip
- SEO: titels, beschrijvingen, Open Graph, `sitemap.xml`, `robots.txt` en
  LocalBusiness-gegevens (alleen bevestigde gegevens)
- Toegankelijkheid: semantische HTML, alt-teksten, toetsenbordnavigatie, "direct naar
  inhoud"-link, zichtbare focus en respect voor "minder beweging"

"De leukste kaaswinkel van Nederland" is een slogan, geen officiële onderscheiding.
