# 📱 App online zetten — alles vanaf je telefoon (geen terminal)

Zo krijg je de verlichtingsapp als een echte app op je iPhone-beginscherm.
Je hebt **geen** computer of terminal nodig — alles doe je in de browser.

We gebruiken **Vercel** (gratis) om de app te hosten. MiBoxer werkt daarmee
overal, ook onderweg. (Philips Hue werkt pas als de app op je thuisnetwerk
draait — zie onderaan.)

---

## Stap 1 — App hosten op Vercel

1. Open in Safari: **[vercel.com/signup](https://vercel.com/signup)**.
2. Kies **Continue with GitHub** en log in met je GitHub-account
   (`stefanolijve85-lab`). Geef Vercel toestemming.
3. Tik op **Add New… → Project**.
4. Je ziet je repositories. Kies **`ios`** en tik **Import**.
   - Vraagt Vercel om toegang? Kies **Only select repositories → `ios` →
     Install**.
5. **Belangrijk — de juiste branch kiezen.** Bij *Configure Project*:
   - Zoek naar **Git Branch** / **Production Branch** en zet die op
     **`claude/miboxer-hue-lighting-app-c7yv37`**.
   - Staat die optie er nog niet? Tik dan gewoon **Deploy**, en zet daarna de
     branch goed via **Settings → Git → Production Branch** en tik
     **Redeploy**.
6. Verder hoef je **niets** in te vullen (geen environment variables). Tik
   **Deploy** en wacht ~1 minuut.
7. Je krijgt een adres zoals **`https://ios-xxxx.vercel.app`**. Open het.

> De app opent in demo-modus — je kunt meteen tikken en kleuren proberen.

---

## Stap 2 — Op je beginscherm zetten

1. Open het Vercel-adres in **Safari**.
2. Tik op de **deelknop** (vierkantje met pijltje omhoog).
3. Kies **Zet op beginscherm** → **Voeg toe**.
4. Open de app vanaf je beginscherm — hij draait nu fullscreen, als een app.

---

## Stap 3 — MiBoxer koppelen (zodat het je échte lampen doet)

Dit is eenmalig en het meest gepriegel op een telefoon, maar het kan.
Vraag gerust of ik je hier stap voor stap doorheen praat.

1. Ga naar **[iot.tuya.com](https://iot.tuya.com)** en maak een gratis account
   (Developer).
2. **Cloud → Development → Create Cloud Project**.
   - Kies bij *Data Center* je regio (**Central Europe**).
   - Na aanmaken zie je **Access ID** en **Access Secret** — bewaar die.
3. In het project → tab **Devices → Link App Account → Add App Account**:
   scan de QR-code met je **Smart Life / MiBoxer**-app. Nu kent het project je
   lampen.
4. Tab **Service API** → controleer dat **IoT Core** is toegevoegd.
5. Open jouw app → **Instellingen ⚙️ → MiBoxer**:
   - Kies regio **Europa**.
   - Plak **Access ID** en **Access Secret**.
   - Tik **Opslaan & verbinding testen** → je ziet je apparaten verschijnen.
6. Zet **Demo-modus uit**. Klaar — de app stuurt nu echt.

---

## En Philips Hue?

Hue kan alleen lokaal (de Bridge is niet vanaf internet bereikbaar). Opties
voor later:

- Draai deze app op een klein apparaat thuis (Raspberry Pi / oude laptop / NAS)
  in plaats van op Vercel — dan werkt Hue én MiBoxer.
- Of we voegen later Hue's cloud-koppeling toe (vereist een aparte Hue
  developer-registratie).

Voor nu: MiBoxer via Vercel lost je grootste probleem op. Hue pakken we erbij
zodra je wilt.

---

## Iets aanpassen zonder terminal?

Je hoeft niks lokaal te bouwen. Vraag mij om wijzigingen — ik pas de code aan en
push naar de branch, en **Vercel zet je app automatisch opnieuw live**. Ververs
daarna de app op je telefoon.
