# Betaalbaar Web

Website, visuele intake en intern dossier voor Betaalbaar Web. Next.js 14 (App Router), React 18, TypeScript, zonder extra runtime-afhankelijkheden.

Dit is een **preview**: de site wordt niet geïndexeerd, er is geen betaling en er wordt niets live gepubliceerd.

## Installeren en starten

```bash
npm install
cp .env.example .env.local   # vul ADMIN_PASSWORD en SESSION_SECRET in
npm run dev                  # http://localhost:3000
```

Productie: `npm run build && npm start`.

## Testen

```bash
npm test          # prijzen, validatie, opslag, exports, uploads, prompt-injectie
npm run typecheck
```

Browsertest (wizard heen/terug, vertakkingen, hervatten, uploadfouten, prijs met/zonder extra, idempotent versturen, toegangscontrole). Start de server op poort 3210 met `ADMIN_PASSWORD=test-wachtwoord-123`, een `SESSION_SECRET` en een lege `DATA_DIR`, en draai:

```bash
node tests/e2e/site.e2e.js <map-voor-schermafbeeldingen> <DATA_DIR>
```

## Configuratie

| Wat | Waar |
| --- | --- |
| Merk, prijzen, levertijd, voorwaarden, contact, projecten, prijsvergelijking | `src/config/site.ts` |
| Vragen, keuzelijsten, validatie en volledigheidschecklist van de intake | `src/lib/intake/schema.ts` |
| Klantbriefing, JSON-export en bouwprompt | `src/lib/intake/exports.ts` |
| Rekenregel voor alle totalen (`eenmalig + maanden × maandbedrag`) | `src/lib/pricing.ts` |

Omgevingsvariabelen (zie `.env.example`):

- `NEXT_PUBLIC_SITE_URL` — basis-URL voor canonicals en sitemap.
- `SITE_INDEXABLE` — alleen `true` zetten als de site openbaar mag worden geïndexeerd. Standaard: `noindex` en `Disallow: /`.
- `ADMIN_PASSWORD` (min. 12 tekens) en `SESSION_SECRET` (min. 32 tekens) — zonder beide is `/beheer` uitgeschakeld.
- `DATA_DIR` — map voor dossiers en uploads. **Moet op een persistente schijf staan.** Op serverless hosting met een vluchtig bestandssysteem (zoals Vercel) gaan dossiers verloren; gebruik daar een host met schijf of vervang `src/lib/server/store.ts` door een database/objectopslag.

## Onderdelen

- Openbare pagina's: home, website laten maken, prijzen, voorbeelden (+3 details), werkwijze, contact, privacy en voorwaarden (concept, noindex).
- `/start` — wizard "Stel mijn website samen". Voortgang wordt pas op de server bewaard na toestemming en e-mailadres; hervatten gaat via een persoonlijke link (`/start#hervat=…`, token alleen gehasht opgeslagen).
- `/beheer` — afgeschermd dossieroverzicht: checklist, status, betalingsstatus (los), planning, bewerkte briefing met versies, wijzigingen na akkoord, exports en afgeschermde downloads.

## Wat nog niet werkt of bewust uit staat

- **Betaling/bestellen**: niet gebouwd; de eindknop is "Verstuur mijn aanvraag" (`flags.paymentsEnabled = false`).
- **E-mail**: er wordt geen mail verstuurd. De hervatlink wordt op het scherm getoond; een aanvraagbevestiging per mail ontbreekt.
- **Analytics**: events zijn aanwezig (`src/lib/analytics.ts`) maar er is geen provider of toestemmingsbanner; `flags.analyticsEnabled = false`.
- **Optionele AI-verfijning van de bouwprompt**: niet gebouwd; de export is de deterministische template.
- **Ophalen van inspiratielinks/bestaande website**: gebeurt bewust niet.
- **Portfoliobeelden**: CSS-schetsen met het label "Conceptvoorbeeld" tot echte beelden zijn aangeleverd.
- **Pagina "website laten maken Emmen"**: niet gemaakt; er is geen echte lokale informatie aangeleverd.
- **Briefing bewerken in beheer** gaat via een JSON-veld (met servervalidatie), nog niet via een formulier.
- **Rate limiting** is per proces in het geheugen; bij meerdere instanties is gedeelde opslag nodig.

## Nog ontbrekende commerciële gegevens

Alles hieronder staat als `null`/open in `src/config/site.ts` en wordt op de site niet ingevuld of geclaimd:

- Omvang van het basispakket (o.a. aantal pagina's) en aantal correctierondes
- Domeinnaam en e-mail inbegrepen of niet
- Wijzigingsbudget, supporturen en responstijd
- Minimumlooptijd en opzegtermijn
- Eigendom en overdracht van de website
- Start van de maandfacturatie en betaalmoment van de €99
- Tekstservice inbegrepen of niet
- Naam/logo: aantal voorstellen, revisies en bestandsformaten
- Btw-status (concept rekent exclusief btw)
- Betekenis van "binnen 7 dagen": livegang of oplevering ter goedkeuring; en de definitieve startvoorwaarde
- Offertekosten/vrijblijvendheid (er wordt nergens "gratis" geclaimd)
- Echte contactgegevens, KvK en bedrijfsnaam; registratie van het domein; controle van de handelsnaam
- Status en beelden per portfolioproject (concept of gerealiseerd)
- Prijzen van Lintema en KlikKlaar hercontroleren vóór publicatie (momentopname 10 november 2026)
