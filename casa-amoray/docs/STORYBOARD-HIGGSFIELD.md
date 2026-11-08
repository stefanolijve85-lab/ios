# Casa Amoray: storyboard en Higgsfield-prompts

Dit document stuurt de beeldproductie voor de video-scrollytelling op de homepage.
Elke scène hieronder hoort bij een sectie in `src/content/scenes.ts`.

> **Status (november 2026):** de **mobiele clips voor scène 02 t/m 06 zijn gemaakt** en staan op
> de site (zie §4). Desktop gebruikt nog de stills met camerapad. Totaal verbruikt: 20 credits.
> Beelden van Winnie maken we alleen mét haar referentiefoto (R2, inmiddels ontvangen).
> Houd haar gezicht, haar natuurlijke krullen en haar glimlach gelijk aan de foto. Kleding in
> de salonscènes: een eenvoudige donkerbruine tuniek (zie scène 03), niet de outfit van de foto.

---

## 0. Vaste afspraken (de "salonbijbel")

Lees dit vóór iedere generatie en plak het **consistentieblok** onder elke prompt.

**Referenties die altijd meegaan**

| # | Referentie | Waarvoor | Status |
|---|------------|----------|--------|
| R1 | Foto of mock-up van de **echte salon** (ontvangsthoek + massageruimte) | Indeling, meubels, materialen | Tijdelijk: `reference/nl/mockup-lounge.png` (Nederlandse tekst) |
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

**Tekst in beeld: alleen Nederlands.** De Portugese teksten uit de mock-ups zijn vervangen
(`scripts/fix-mockup-text.py`, resultaat in `reference/nl/`). Gebruik die Nederlandse versies als
referentie. Vaste teksten in de salon:
- muur onder het logo: **"MASSAGE · WELZIJN · VERBINDING"**
- etiket van de olie: **"MASSAGEOLIE"** en **"LAVENDEL"**
- kaartje: **"Bedankt dat je voor Casa Amoray kiest."**

AI-modellen maken vaak fouten in tekst. Vraag daarom liefst om **geen tekst** behalve het logo
("no text, no lettering, only the Casa Amoray logo"). Controleer elke clip op spelling en zet een
foute tekst niet op de site.

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

**Foto van Winnie (scène 08):** staat op `public/media/winnie/winnie-portret.webp` (4:5, 1024×1280; salonfoto in tuniek).
Een nieuwere of scherpere foto? Overschrijf dit bestand (staand 4:5, liefst 1200×1500).


---

## 4. Gemaakt: mobiele clips (9:16)

Gekozen voor **zo min mogelijk credits**: één proef, daarna de rest in één batch.

| Instelling | Waarde | Waarom |
|---|---|---|
| Model | Seedance 2.0 **Mini** | 4 credits per clip; de proef was al vloeiend en consistent |
| Duur | 4 s | Genoeg voor 48 scrollframes; korter = goedkoper |
| Resolutie | 720p (720×1280) | Bron; de site gebruikt frames van 576×1024 (lichter te tekenen) |
| Geluid | uit | Niet nodig op de site |
| Beginframe | 9:16-uitsnede van de Nederlandse mock-up (`reference/nl/`) | Salon blijft exact gelijk; geen extra beeldgeneratie nodig |
| Scène 02 | ook een **eindframe** (massagetafel) | Camerabeweging eindigt precies waar het storyboard wil |
| Scène 03 | **referentiefoto van Winnie** als `image_references` | Herkenbaar gezicht, krullen en glimlach |

Kosten: 5 clips × 4 credits = **20 credits**. Bronbestanden: `reference/higgsfield/*.mp4`.

**Nabewerking (gratis).** Opnieuw omzetten? Gebruik precies deze opdrachten
(96 frames per scène, 720×1280, licht verscherpt):

```bash
H=reference/higgsfield
npm run frames -- $H/02-binnenkomst-9x16.mp4 binnenkomst mobile 96
python3 scripts/clean-wall-text.py public/media/scenes/binnenkomst/mobile 88 374 210 398 --extend-left
python3 scripts/match-color.py public/media/scenes/binnenkomst/mobile public/media/stills/lounge-mobile.webp
npm run frames -- $H/03-welkom-9x16.mp4 welkom mobile 96 "eq=gamma=1.06"
npm run frames -- $H/04-ruimte-9x16.mp4 ruimte mobile 96 "eq=gamma=1.23"
python3 scripts/clean-wall-text.py public/media/scenes/ruimte/mobile 0 300 145 328 --extend-left
npm run frames -- $H/05-behandeling-9x16.mp4 behandeling mobile 96 "eq=gamma=1.08"
npm run frames -- $H/06-nagevoel-9x16.mp4 nagevoel mobile 96 "crop=iw-110:ih:110:0,eq=gamma=1.15"
```

- **Aansluiting op de hero:** `match-color.py` stemt kleur en belichting van scène 02 af op de
  hero-foto (gemeten op frame 1, toegepast op alle frames), zodat de overgang van foto naar video niet opvalt.

- **Muurtekst:** AI verbasterde "VERBINDING" tot "VERBINOING". In 02 en 04 is de regel per frame
  gevolgd en weggewerkt (`clean-wall-text.py`); 03 is opnieuw gemaakt (zie hieronder); in 06 is de
  linkerrand weggesneden. De muur in de hero toont daarom ook alleen het logo.
- **Helderheid:** de clips waren donkerder dan de opening (54–66 tegen 71). Met `eq=gamma` is elke
  scène op ongeveer dezelfde helderheid gebracht (± 73).

**AI-vermelding:** op verzoek staat er nergens op de site een AI-vermelding (niet in beeld, niet in de
footer). Let op: de EU AI-verordening (art. 50) vraagt een vermelding bij AI-beelden van echte personen.
Terugzetten kan via `aiNote` in `src/content/scenes.ts` of een regel in de footer. **Laat Winnie de clip goedkeuren.**

**Desktop (16:9) later:** dezelfde prompts en beginframes in 16:9 (uitsnede uit dezelfde mock-ups),
ook met Mini: 5 × 4 = 20 credits. Daarna `npm run frames -- <clip> <scene> desktop` en klaar;
de `landscape`-still in `scenes.ts` wordt dan automatisch niet meer gebruikt.

### Gebruikte prompts

**02 Binnenkomst** (begin = ontvangsthoek, eind = massagetafel):
> One continuous, very slow and smooth gimbal dolly forward at eye level through a warm, candle-lit
> boutique massage salon: past the green velvet armchairs and the brass sunburst room divider, gliding
> toward the softly lit massage table in the arched niche. Steady camera, no cuts, no zoom, no people.
> Keep all furniture, colours and the wall logo exactly as in the start image. Calm, cinematic, photorealistic.

**03 Het welkom** (+ referentiefoto Winnie):
> In this exact reception corner of a warm boutique massage salon, the woman from the reference photo
> (same face, same natural curly hair, warm smile) walks in from the side wearing a simple dark brown
> salon tunic, and calmly pours herbal tea from a ceramic teapot into a cup on the small round
> stone-mosaic table between the green velvet armchairs. She smiles warmly toward the camera, welcoming
> the guest. Very slow gentle dolly-in toward the table. Natural realistic hands with five fingers. Keep
> furniture, colours and lighting exactly as in the start image. No text. Photorealistic, calm, cinematic.

**04 De massageruimte:**
> Very slow, smooth lateral tracking shot gliding past this still life in a candle-lit massage room: the
> amber massage oil bottle, the small ceramic bowls, the wooden massage tools, the rolled towel and the
> olive branches. Candle flames flicker softly, gentle shallow depth of field. No people. Keep all objects,
> labels and colours exactly as in the start image; do not add or change any text. Calm, warm, cinematic, photorealistic.

**05 De behandeling:**
> A calm, professional foot massage continues exactly as in the start image: the therapist's oiled hands
> make one slow, long, gentle gliding stroke along the foot. Very slow push-in toward the hands.
> Anatomically correct hands with five fingers each, natural skin, soft candlelight. Respectful and
> luxurious. Keep everything else exactly as in the start image; do not add or change any text. Photorealistic, cinematic.

**06 Na afloop:**
> After the massage: the woman rests completely relaxed on the massage table under the towel with the
> warm compress over her eyes, breathing slowly and peacefully. The camera very slowly pulls back and
> gently comes to rest. Candle flames flicker softly. Very calm, serene, minimal motion. Keep everything
> exactly as in the start image; do not add or change any text. Photorealistic, cinematic.


### 03 Het welkom, versie 2 (4 credits)

De eerste versie verbasterde de muurtekst en Winnies hoofd viel na het wegsnijden deels buiten beeld.
Versie 2 start op de ontvangsthoek **zonder muurregel** (alleen het logo; `reference/nl/mockup-lounge.png`,
uitsnede x 30%, y 55%, zoom 1,15) met dezelfde referentiefoto. Niets weggesneden; gamma 1,06.

> In this exact reception corner of a warm boutique massage salon, the woman from the reference photo
> (same face, same natural curly hair, warm smile) walks in from the side wearing a simple dark brown
> salon tunic and soft slippers, and calmly pours herbal tea from a ceramic teapot into a cup on the
> small round stone-mosaic table between the green velvet armchairs. She smiles warmly toward the
> camera, welcoming the guest. Medium-wide framing: her whole head and shoulders always stay fully in
> frame with generous space above her head; the camera stays at a steady distance with a very slight,
> gentle drift. Natural realistic hands with five fingers. Keep the wall, logo, furniture, colours and
> lighting exactly as in the start image; do not add any text on the wall. Photorealistic, calm, cinematic.

Totaal verbruikt aan clips: 24 credits.
