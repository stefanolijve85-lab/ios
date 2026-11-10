/**
 * FOTOMANIFEST — Bij Tanja
 * ------------------------------------------------------------
 * Elke foto in public/fotos/bij-tanja/ krijgt hier een regel.
 *
 *  bestand   bestandsnaam in public/fotos/bij-tanja/
 *  categorie waar de foto over gaat (gebruikt voor galerij en filters)
 *  alt       beschrijving voor schermlezers en Google: wat is er écht te zien?
 *  volgorde  volgorde in de galerij (laag = eerst)
 *  hero      true = geschikt als grote openingsfoto
 *  bijschrift (optioneel) korte tekst onder de foto in de galerij
 *  focus     (optioneel) welk deel belangrijk is bij bijsnijden, CSS object-position
 *
 * Afmetingen en blur-preview komen automatisch uit fotos.generated.ts
 * (wordt gemaakt door `npm run fotos`).
 */
import { fotoMeta } from "./fotos.generated";

export type FotoCategorie =
  | "winkel"
  | "tanja"
  | "kaas"
  | "wijn"
  | "bier-sap"
  | "noten"
  | "snoep"
  | "delicatessen"
  | "cadeaus";

export type FotoInvoer = {
  bestand: string;
  categorie: FotoCategorie;
  alt: string;
  volgorde: number;
  hero?: boolean;
  bijschrift?: string;
  focus?: string;
};

const lijst = [
  {
    bestand: "winkel-entree-tanja.jpg",
    categorie: "winkel",
    alt: "Tanja staat lachend in de open deur van haar winkel Bij Tanja in Winkelcentrum Angelslo, met naast de ingang een wijnvat en een koeienbeeld",
    volgorde: 1,
    hero: true,
    bijschrift: "Welkom! De deur staat open.",
    focus: "68% 50%",
  },
  {
    bestand: "winkel-overzicht.jpg",
    categorie: "winkel",
    alt: "Overzicht van de winkel met houten vloer, kasten vol noten en knabbels, een koeling en in het midden een tafel met cadeaupakketten",
    volgorde: 2,
    hero: true,
    bijschrift: "Even rondkijken? Er is genoeg te ontdekken.",
    focus: "50% 55%",
  },
  {
    bestand: "kaaswand.jpg",
    categorie: "kaas",
    alt: "Wand met houten planken vol hele en aangesneden kazen, van jong en belegen tot kruidenkaas, met krijtbordjes erbij",
    volgorde: 3,
    bijschrift: "De kaaswand: van jong tot oud en alles daartussen.",
    focus: "50% 45%",
  },
  {
    bestand: "kaastoonbank-weegschaal.jpg",
    categorie: "kaas",
    alt: "Toonbank met grote kaaswielen, een zwarte oude kaas en een antieke weegschaal, daaronder zakjes noten en eieren",
    volgorde: 4,
    bijschrift: "Een zwarte oude kaas naast de ouderwetse weegschaal.",
    focus: "45% 50%",
  },
  {
    bestand: "kaaswand-weegschaal.jpg",
    categorie: "kaas",
    alt: "Kaasplanken achter de toonbank met de weegschaal met het Bij Tanja-logo op het scherm",
    volgorde: 5,
    focus: "55% 50%",
  },
  {
    bestand: "notenbar-en-kaaswand.jpg",
    categorie: "noten",
    alt: "Lange toonbank met bakken vers geroosterde noten achter glas, met daarachter de kaaswand",
    volgorde: 6,
    bijschrift: "Heerlijke vers gebrande noten.",
    focus: "60% 60%",
  },
  {
    bestand: "snoep-en-knabbels-wand.jpg",
    categorie: "snoep",
    alt: "Zwarte vakkenkasten vol bakjes met chocolade, snoep en knabbels, met links een rek met candy sticks en lolly's",
    volgorde: 7,
    bijschrift: "Snoep en zoetigheid, voor groot en klein.",
    focus: "35% 50%",
  },
  {
    bestand: "speciaalbier-en-knabbels.jpg",
    categorie: "bier-sap",
    alt: "Kasten met zakken borrelknabbels en een rij speciaalbieren zoals tripel, weizen, IPA en quadrupel",
    volgorde: 8,
    bijschrift: "Speciaalbier en knabbels: de borrel is compleet.",
    focus: "70% 50%",
  },
  {
    bestand: "wijn-worstjes-sapjes.jpg",
    categorie: "wijn",
    alt: "Kast vol rode, witte en rosé wijnen, ernaast hangende worstjes, een rek met sappen en een houten kast met delicatessen",
    volgorde: 9,
    bijschrift: "Wijn, worstjes, sapjes en delicatessen.",
    focus: "30% 55%",
  },
  {
    bestand: "koeling-delicatessen-bubbels.jpg",
    categorie: "delicatessen",
    alt: "Verlichte koeling met olijven, tapenades en buitenlandse kazen, naast een donkere kast met bubbels en cadeauverpakkingen",
    volgorde: 10,
    bijschrift: "Uit de koeling: olijven, spreads en bijzondere kazen.",
    focus: "38% 50%",
  },
  {
    bestand: "cadeaupakketten-tafel.jpg",
    categorie: "cadeaus",
    alt: "Houten kratten met daarop feestelijk ingepakte cadeaupakketten met noten, kaas, wijn en snoep, met strikjes en krijtbordjes",
    volgorde: 11,
    bijschrift: "Ingepakt en wel: cadeaupakketten op tafel.",
    focus: "50% 45%",
  },
  {
    bestand: "sapjes-en-inpaktafel.jpg",
    categorie: "cadeaus",
    alt: "Rek met sappen en jam, een houten kast met delicatessen en Tanja aan de inpaktafel met kleurige rollen lint",
    volgorde: 12,
    bijschrift: "Aan de inpaktafel, met lint in alle kleuren.",
    focus: "70% 50%",
  },
  {
    bestand: "tanja-in-de-deur.jpg",
    categorie: "tanja",
    alt: "Tanja in zwart shirt en beige schort staat glimlachend in de deuropening van haar winkel",
    volgorde: 13,
    focus: "74% 40%",
  },
  {
    bestand: "tanja-zwaait.jpg",
    categorie: "tanja",
    alt: "Tanja zwaait vrolijk vanuit de deur van Bij Tanja",
    volgorde: 14,
    bijschrift: "Hoi! Kom gerust binnen.",
    focus: "66% 45%",
  },
] satisfies FotoInvoer[];

export type Foto = FotoInvoer & {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

const PAD = "/fotos/bij-tanja/";

export const fotos: Foto[] = lijst
  .map((f: FotoInvoer) => {
    const m = fotoMeta[f.bestand];
    return {
      ...f,
      src: PAD + f.bestand,
      width: m?.width ?? 1600,
      height: m?.height ?? 1200,
      blurDataURL: m?.blurDataURL,
    };
  })
  .sort((a, b) => a.volgorde - b.volgorde);

/** Haal één foto op via bestandsnaam. Gooit een duidelijke fout bij een typefout. */
export function foto(bestand: string): Foto {
  const f = fotos.find((x) => x.bestand === bestand);
  if (!f) throw new Error(`Foto "${bestand}" staat niet in src/content/fotos.ts`);
  return f;
}

export const fotosIn = (categorie: FotoCategorie) => fotos.filter((f) => f.categorie === categorie);
