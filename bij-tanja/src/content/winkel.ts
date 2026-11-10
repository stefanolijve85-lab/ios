/**
 * WINKELGEGEVENS — Bij Tanja
 * ------------------------------------------------------------
 * Eén centrale plek voor alle contact- en winkelgegevens.
 *
 * Regel: vul alleen gegevens in die BEVESTIGD zijn (door Tanja zelf of via
 * https://www.angelslo.nl/winkels/bij-tanja). Laat een veld op `null` staan
 * zolang het niet bevestigd is: de website verbergt het dan automatisch, en
 * het komt ook niet in de structured data voor Google terecht.
 */

export type Dag =
  | "maandag"
  | "dinsdag"
  | "woensdag"
  | "donderdag"
  | "vrijdag"
  | "zaterdag"
  | "zondag";

/** Bijv. { open: "09:00", dicht: "18:00" } of `"gesloten"`. */
export type Tijden = { open: string; dicht: string } | "gesloten";

export const winkel = {
  naam: "Bij Tanja",
  ondertitel: "Kaas, noten & meer",
  /** Merkuitspraak / slogan — geen officiële onderscheiding. */
  slogan: "De leukste kaaswinkel van Nederland",
  kernboodschap: "Bij Tanja kom je voor iets lekkers, maar blijf je voor de gezelligheid!",

  /** Publieke URL van de website (zet NEXT_PUBLIC_SITE_URL bij je hosting). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  adres: {
    /** Bevestigd: de winkel zit in Winkelcentrum Angelslo in Emmen. */
    winkelcentrum: "Winkelcentrum Angelslo",
    plaats: "Emmen",
    provincie: "Drenthe",
    land: "NL",
    // TODO bevestigen — straat + huisnummer en postcode (staan op de Angelslo-pagina).
    straat: null as string | null,
    postcode: null as string | null,
  },

  /** Zoekopdracht voor de Google Maps-routeknop. */
  routeZoekterm: "Bij Tanja, Winkelcentrum Angelslo, Emmen",

  // TODO bevestigen — telefoonnummer, bijv. "0591 123456"
  telefoon: null as string | null,
  // TODO bevestigen — alleen invullen als de winkel WhatsApp echt gebruikt, bijv. "31612345678"
  whatsapp: null as string | null,
  // TODO bevestigen
  email: null as string | null,

  /**
   * Openingstijden. Laat op `null` tot ze bevestigd zijn; de site verwijst dan
   * naar de pagina van het winkelcentrum. Voorbeeld als ze bekend zijn:
   *
   * openingstijden: {
   *   maandag: "gesloten",
   *   dinsdag: { open: "09:00", dicht: "18:00" },
   *   ...
   * },
   */
  openingstijden: null as Record<Dag, Tijden> | null,
  /** Korte notitie onder de openingstijden, bijv. "Rond de feestdagen kunnen tijden afwijken." */
  openingstijdenNotitie: null as string | null,

  /** Officiële socialmediakanalen (alleen echte, bevestigde links). */
  social: [
    // { naam: "Facebook", url: "https://www.facebook.com/..." },
    // { naam: "Instagram", url: "https://www.instagram.com/..." },
  ] as { naam: "Facebook" | "Instagram"; url: string }[],

  /** Bronpagina met de actuele winkelinformatie. */
  bronpagina: "https://www.angelslo.nl/winkels/bij-tanja",
} as const;

export const dagen: Dag[] = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
];

export const adresRegel = () =>
  [winkel.adres.straat, winkel.adres.winkelcentrum, [winkel.adres.postcode, winkel.adres.plaats].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

export const routeUrl = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [winkel.routeZoekterm, winkel.adres.straat, winkel.adres.postcode].filter(Boolean).join(" ")
  )}`;
