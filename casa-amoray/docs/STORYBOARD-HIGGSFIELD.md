# Casa Amoray: storyboard en Higgsfield-prompts

Dit document stuurt de beeldproductie voor de video-scrollytelling op de homepage.
Elke scène hieronder hoort bij een sectie in `src/content/scenes.ts`.

> **Status:** alle beelden op de site zijn nu **tijdelijk**. Ze zijn gemaakt van de
> mock-ups in `reference/` en op de site gemarkeerd met het label "Tijdelijk".
> Beelden van Winnie maken we alleen mét haar referentiefoto (R2, inmiddels ontvangen).
> Houd haar gezicht, haar natuurlijke krullen en haar glimlach gelijk aan de foto. Kleding in
> de salonscènes: een eenvoudige donkerbruine tuniek (zie scène 03), niet de outfit van de foto.

---

## 0. Vaste afspraken (de "salonbijbel")

Lees dit vóór iedere generatie en plak het **consistentieblok** onder elke prompt.

**Referenties die altijd meegaan**

| # | Referentie | Waarvoor | Status |
|---|------------|----------|--------|
| R1 | Foto of mock-up van de **echte salon** (ontvangsthoek + massageruimte) | Indeling, meubels, materialen | Tijdelijk: `reference/mockup-lounge.jpg` |
| R2 | Duidelijke **foto van Winnie** (gezicht en houding, natuurlijk licht) | Herkenbaarheid in scène 3 en 5 | **Ontvangen** (selfie, natuurlijk licht, recht in de camera). Uitsnede op de site: `public/media/winnie/winnie-portret.webp`. Het origineel staat niet in de repository; upload dat bij het genereren rechtstreeks als referentie. |
| R3 | Logo: woordmerk + ster | Muurlogo, flessen, handdoeken | `reference/logo-*.jpg` |

**Vaste inrichting (mag niet veranderen tussen scènes)**

- Ontvangsthoek: twee **diepgroene fluwelen fauteuils** met ribbels, een **rond bijzettafeltje
  met natuurstenen mozaïekblad** op messing poot, een amberkleurig glazen bijzettafeltje, een
  **rond jute vloerkleed** en een **staande lamp** met rotan kap op een messing driepoot.
- Muur: warm crème stucwerk met het **Casa Amoray-logo** in donkerbruin.
- Scheiding: **messing kamerscherm** met zonnestraalmotief, met een olijfboompje erachter.
- Massageruimte: houten **massagetafel** met crème laken, twee opgerolde handdoeken, een
  **boog-nis** met verticale lamellen en warm indirect licht, planken met **amberkleurige
  apothekersflessen**, kaarsen.
- Vloer: lichte betonlook.

**Licht en kleur:** avond, warm (2700K), kaarslicht en indirect licht, zachte schaduwen.
Palet: crème `#F8F1EB`, warm beige `#E8D6C8`, dusty rose `#C99288`, taupe `#A78B7B`, donkerbruin `#49352E`.

**Tekst in beeld:** de mock-ups bevatten Portugese tekst ("Massagem · bem-estar · conexão",
"Óleo de massagem"). In de definitieve beelden: **geen** tekst behalve het logo, óf Nederlands
("Massage · Ontspanning · Aandacht"). Liever geen tekst. Die zetten we in de website zelf.

**Camera:** 35 mm-look, ooghoogte (± 1,40 m), rustige dolly/gimbal, geen snelle bewegingen,
geen zoom-effecten, geen cuts binnen een clip. Begin- en eindframe van opeenvolgende scènes
moeten op elkaar aansluiten.

**Kwaliteit:** geen vervormde handen of vingers, geen extra ledematen, gezichten natuurlijk.
Respectvol: personen altijd netjes bedekt met handdoek, geen suggestieve beelden.

**Consistentieblok** (Engels werkt het beste in de meeste modellen):

```
Consistent interior: luxury boutique massage salon "Casa Amoray", warm evening light 2700K,
cream plaster walls, two deep green ribbed velvet armchairs, small round stone-mosaic side
table on brass base, round jute rug, rattan floor lamp on brass tripod, brass sunburst room
divider with small olive tree, wooden massage table with cream linen, arched niche with
vertical slats and warm indirect light, amber apothecary bottles, candles, light concrete floor.
Photorealistic, 35mm, shallow depth of field, soft shadows, calm and intimate, no text,
no distorted hands, no extra fingers.
```

---

## 1. Technische specificaties per clip

| | Mobiel (primair) | Desktop |
|---|---|---|
| Beeldverhouding | **9:16 staand** | **16:9 liggend** |
| Exportresolutie | min. 1080×1920 | min. 1920×1080 |
| Duur | 4–6 s | 4–6 s |
| Beweging | één doorlopende camerabeweging | idem, bredere kadrering |
| Verwerking | `npm run frames -- clip.mp4 <scene-id> mobile` | `npm run frames -- clip.mp4 <scene-id> desktop` |

**Geen mobiele video uitrekken voor desktop.** Genereer per scène twee composities. Op
desktop staat de tekst links, dus houd de linker 40% van het beeld rustig. Op mobiel staat de
tekst onderin, dus houd de onderste 35% rustig.

---

## 2. Scènes

### Scène 01: De uitnodiging (hero)
- **Scene-id:** hero (`heroMedia` in `scenes.ts`)
- **Gewenst beeld:** de ontvangsthoek in avondlicht, leeg, uitnodigend. Logo op de muur.
- **Camerabeweging:** vrijwel stil; heel langzame push-in (2–3%), kaarsvlammen bewegen.
- **Beginframe:** totaal van de ontvangsthoek, fauteuils links, kamerscherm rechts.
- **Eindframe:** idem, 3% dichterbij.
- **Duur:** 6 s (loop) of één still.
- **Mobiel 9:16:** fauteuils en tafeltje centraal, logo bovenin, onderste derde rustig (vloerkleed).
- **Desktop 16:9:** fauteuils links-midden, doorkijk naar de massageruimte rechts.
- **Prompt:**
  ```
  Wide interior shot of an empty luxury boutique massage salon reception corner in the evening,
  two deep green velvet armchairs around a small round table, soft candlelight flickering,
  warm and welcoming, very slow subtle push-in. [consistentieblok]
  ```

### Scène 02: Binnenkomst
- **Scene-id:** `binnenkomst` (beeldreeks; nu tijdelijk gemaakt van de mock-up)
- **Gewenst beeld:** het gevoel dat je zelf naar binnen loopt.
- **Camerabeweging:** dolly vooruit op ooghoogte, langs de fauteuils en het kamerscherm,
  richting de massageruimte.
- **Beginframe:** = eindframe scène 01.
- **Eindframe:** halftotaal van de ontvangsthoek met de fauteuils, net vóór de bocht naar de
  massageruimte (sluit aan op scène 03).
- **Duur:** 5 s.
- **Mobiel 9:16:** pad loopt door het midden van het beeld; vloerkleed onderin.
- **Desktop 16:9:** pad iets rechts van het midden; links rustige muur voor tekst.
- **Prompt:**
  ```
  Smooth first-person gimbal dolly forward entering a luxury boutique massage salon at eye level,
  passing the reception corner with two green velvet armchairs, the brass sunburst divider
  revealing a glimpse of the softly lit treatment room behind, slow and steady, no people.
  [consistentieblok]
  ```

### Scène 03: Het welkom (met Winnie)
- **Scene-id:** `welkom`
- **Gewenst beeld:** Winnie verwelkomt je in de ontvangsthoek en schenkt een kopje thee in.
- **Vereist:** **R2, de echte foto van Winnie.** Zonder R2 niet genereren.
- **Camerabeweging:** langzame dolly in naar het tafeltje, lichte boog naar rechts.
- **Beginframe:** halftotaal van beide fauteuils; Winnie staat naast het tafeltje met een theepot.
- **Eindframe:** dichterbij: handen schenken thee in twee kopjes, Winnie kijkt vriendelijk naar de camera (de bezoekster).
- **Duur:** 5 s.
- **Mobiel 9:16:** Winnie en het tafeltje centraal, kopjes in het midden van het beeld.
- **Desktop 16:9:** Winnie rechts van het midden, lege fauteuil links (plek voor de bezoekster en de tekst).
- **Prompt:**
  ```
  The woman from the reference photo (Winnie, owner of the salon), warm friendly smile, dressed
  in a simple dark brown uniform tunic, standing beside a small round stone-mosaic table between
  two green velvet armchairs, calmly pouring herbal tea from a ceramic teapot into two cups,
  slow dolly-in toward the table, natural realistic hands, welcoming and personal.
  Keep her face, natural curly hair and smile identical to the reference photo. [consistentieblok]
  ```

### Scène 04: De massageruimte
- **Scene-id:** `ruimte`
- **Gewenst beeld:** de klaargemaakte massagetafel met warme handdoeken, olie en zacht licht.
- **Camerabeweging:** langzame zijwaartse track langs de tafel, eindigend op de boog-nis.
- **Beginframe:** het kamerscherm op de voorgrond (aansluiting op scène 03), daarachter de tafel.
- **Eindframe:** tafel met opgerolde handdoeken centraal, boog-nis met licht erachter.
- **Duur:** 5 s.
- **Mobiel 9:16:** tafel diagonaal door het beeld, boog bovenin.
- **Desktop 16:9:** tafel rechts, boog rechtsboven, links rustige muur.
- **Prompt:**
  ```
  Slow lateral tracking shot past a brass sunburst divider into a calm treatment room, wooden
  massage table with cream linen and two rolled warm towels, a dark amber massage oil bottle and
  small ceramic bowl on a wooden tray, candles, arched niche with vertical slats glowing softly,
  no people. [consistentieblok]
  ```

### Scène 05: De behandeling
- **Scene-id:** `behandeling`
- **Gewenst beeld:** rustige, professionele massage. Respectvol en luxe.
- **Vereist:** R2 als Winnie herkenbaar in beeld komt. Alternatief zonder R2: alleen
  handen en onderarmen in beeld (geen gezicht).
- **Camerabeweging:** zeer langzame push-in op de handen; massagebeweging in één vloeiende streek.
- **Beginframe:** halftotaal: cliënte ligt onder een handdoek op de tafel, rug of schouders zichtbaar.
- **Eindframe:** close-up van de handen die een rustige, lange streek maken.
- **Duur:** 5–6 s.
- **Mobiel 9:16:** handen in het bovenste deel, handdoek onderin (rustig vlak voor tekst).
- **Desktop 16:9:** handen rechts van het midden.
- **Prompt:**
  ```
  A woman lies relaxed face-down on a massage table, modestly covered with a cream towel up to
  her shoulder blades, a therapist's hands perform one slow long gliding massage stroke over her
  upper back with warm oil, very slow push-in toward the hands, anatomically correct hands with
  five fingers each, calm, respectful and professional. [consistentieblok]
  ```

### Scène 06: Het gevoel na afloop
- **Scene-id:** `nagevoel`
- **Gewenst beeld:** stilte na de behandeling: ontspannen, kopje thee, zacht licht.
- **Camerabeweging:** camera komt langzaam tot stilstand (ease-out), lichte uitzoom.
- **Beginframe:** cliënte zit ontspannen in de groene fauteuil, in een badjas, met thee.
- **Eindframe:** iets wijder: fauteuil, thee, kaars. Rust.
- **Duur:** 5 s.
- **Mobiel 9:16:** fauteuil centraal, onderste derde rustig.
- **Desktop 16:9:** fauteuil rechts, links lege warme muur voor tekst.
- **Prompt:**
  ```
  After the massage: a relaxed woman in a soft cream robe sits curled up in a green velvet
  armchair holding a cup of tea with both hands, eyes half closed, content smile, candlelight,
  the camera slowly pulls back and comes to rest, serene and peaceful. [consistentieblok]
  ```

---

## 3. Van clip naar website (in 3 stappen)

1. Exporteer per scène een **9:16** en een **16:9** clip (MP4, H.264, hoogste kwaliteit).
2. Draai vanuit `casa-amoray/`:
   ```bash
   npm run frames -- pad/naar/02-binnenkomst-9x16.mp4 binnenkomst mobile
   npm run frames -- pad/naar/02-binnenkomst-16x9.mp4 binnenkomst desktop
   ```
3. In `src/content/scenes.ts`: zet de scène op `media: { kind: "sequence", id: "<scene-id>" }`,
   verwijder de regel `placeholder: "..."` en pas de `alt`-tekst aan op het nieuwe beeld.

De posterafbeelding (statische weergave, verminderde beweging, trage verbinding) is automatisch
het eerste frame. Zorg dus dat frame 1 ook als losse foto mooi is.

**Foto van Winnie (scène 08):** staat op `public/media/winnie/winnie-portret.webp` (4:5, 640×800).
Een nieuwere of scherpere foto? Overschrijf dit bestand (staand 4:5, liefst 1200×1500).
