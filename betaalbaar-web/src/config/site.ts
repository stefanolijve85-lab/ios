/**
 * Centrale configuratie voor merk, prijzen, voorwaarden, projecten en contact.
 *
 * Alles wat `null` is, is NOG NIET BEVESTIGD. De site toont dan geen
 * verzonnen invulling, maar verwijst naar de afspraken die vóór akkoord
 * worden vastgelegd. Zie `openItems` voor de volledige lijst.
 */

export const brand = {
  name: "Betaalbaar Web",
  descriptor: "Professionele websites voor ondernemers",
  tagline: "Professionele websites. Slim geprijsd.",
  /** Domein is nog niet geregistreerd/bevestigd. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export const pricing = {
  /** Eenmalig, complete website binnen de basispakketomvang. */
  oneOff: 99,
  /** Per maand, hosting en service. */
  monthly: 59,
  /** Optioneel: bedrijfsnaam + logo samen. Eenmalig, nooit vooraf geselecteerd. */
  nameLogo: 49,
  /** Btw-status is nog niet bevestigd; concept rekent exclusief btw. */
  vatLabel: "Bedragen exclusief btw",
  vatConfirmed: false,
};

export const delivery = {
  days: 7,
  /** Voorgestelde startvoorwaarde; vóór verkoop vast te leggen. */
  startCondition:
    "De 7 kalenderdagen gaan in na je akkoord en nadat alle noodzakelijke input compleet is aangeleverd.",
  /** Nog te bevestigen: 'livegang' of 'oplevering ter goedkeuring'. */
  meaning: null as null | "livegang" | "oplevering ter goedkeuring",
  meaningFallback:
    "Of dit livegang of oplevering ter goedkeuring betekent, staat in je afspraken voordat je akkoord geeft.",
};

/** Echte contactgegevens. Zolang deze leeg zijn, toont de site geen contactkanaal. */
export const contact = {
  email: null as string | null,
  phone: null as string | null,
  whatsapp: null as string | null,
  address: null as string | null,
  kvk: null as string | null,
  legalName: null as string | null,
};

export const flags = {
  /** Echte betaling pas aanzetten als alle commerciële gegevens bevestigd zijn. */
  paymentsEnabled: false,
  /** Indexering staat uit tot expliciet aangezet via SITE_INDEXABLE=true. */
  indexable: process.env.SITE_INDEXABLE === "true",
  /** Analytics staat uit tot er een provider én privacykeuze is ingericht. */
  analyticsEnabled: false,
  /** Geen 'gratis offerte' claimen zonder bevestiging. */
  freeQuoteConfirmed: false,
};

/** Commerciële voorwaarden. `null` = nog niet bevestigd. */
export const terms: Record<string, { label: string; value: string | null }> = {
  packageScope: { label: "Omvang van het basispakket (o.a. aantal pagina's)", value: null },
  revisionRounds: { label: "Aantal correctierondes", value: null },
  domainAndEmail: { label: "Domeinnaam en e-mail inbegrepen of niet", value: null },
  changeBudget: { label: "Wijzigingsbudget per maand", value: null },
  supportHours: { label: "Supporturen", value: null },
  responseTime: { label: "Responstijd", value: null },
  minimumTerm: { label: "Minimumlooptijd", value: null },
  noticePeriod: { label: "Opzegtermijn", value: null },
  ownership: { label: "Eigendom en overdracht van de website", value: null },
  monthlyBillingStart: { label: "Start van de maandfacturatie", value: null },
  oneOffPaymentMoment: { label: "Betaalmoment van de €99", value: null },
  copywriting: { label: "Tekstservice inbegrepen of niet", value: null },
  nameLogoScope: { label: "Naam/logo: aantal voorstellen, revisies en bestandsformaten", value: null },
};

/** Overige open punten die geen voorwaarde zijn maar wel vóór publicatie moeten. */
export const otherOpenItems = [
  "Btw-status bevestigen (concept rekent exclusief btw).",
  "Domeinnaam registreren en NEXT_PUBLIC_SITE_URL instellen.",
  "Handelsnaam/merk laten controleren.",
  "Betekenis van 'binnen 7 dagen' vastleggen: livegang of oplevering ter goedkeuring.",
  "Startvoorwaarde voor de 7 dagen definitief maken.",
  "Echte contactgegevens, KvK en bedrijfsnaam invullen (contact, privacy, voorwaarden).",
  "Offertekosten/vrijblijvendheid bevestigen voordat 'gratis' of 'vrijblijvend' wordt geclaimd.",
  "Portfoliobeelden en status (concept/gerealiseerd) per project bevestigen.",
  "Prijsvoorbeelden van andere aanbieders hercontroleren vóór publicatie.",
  "E-mailverzending inrichten voor de hervatlink en aanvraagbevestiging.",
];

export function openItems(): string[] {
  const t = Object.values(terms)
    .filter((x) => x.value === null)
    .map((x) => `${x.label}: nog vast te stellen.`);
  return [...t, ...otherOpenItems];
}

/** Functies die buiten het basispakket apart beoordeeld worden. */
export const onRequest = [
  "Webshop en online betalingen",
  "Live gekoppelde boekingssoftware of agenda",
  "Ledenomgeving of inlog voor klanten",
  "Maatwerkkoppelingen met andere software",
  "Meertalige website",
];

export type Project = {
  slug: string;
  name: string;
  /** 'concept' tot realisatie is bevestigd. */
  status: "concept" | "gerealiseerd";
  kind: string;
  summary: string;
  goals: string[];
  visual: string[];
  functional: string[];
  theme: "detepo" | "casa" | "tanja";
  /** Alleen een bevestigde, echte URL. Nooit verzinnen. */
  liveUrl: string | null;
};

export const projects: Project[] = [
  {
    slug: "detepo",
    name: "Detepo",
    status: "concept",
    kind: "Technologiemerk · klantentelling",
    summary:
      "Een zakelijke presentatie voor een technologiemerk rondom klantentelling, met overzichtelijke productinformatie.",
    goals: [
      "Productinformatie in één oogopslag te volgen",
      "Een zakelijke, technische uitstraling",
      "Een duidelijke route naar contact voor zakelijke bezoekers",
    ],
    visual: [
      "Donker, strak kleurgebruik met één helder accent, zodat cijfers en productdetails opvallen.",
      "Veel ruimte rond koppen; technische informatie in korte, scanbare blokken.",
    ],
    functional: [
      "Productuitleg opgebouwd van 'wat het doet' naar 'hoe het werkt'.",
      "Eén primaire actie per scherm: contact opnemen.",
    ],
    theme: "detepo",
    liveUrl: null,
  },
  {
    slug: "casa-amoray",
    name: "Casa Amoray",
    status: "concept",
    kind: "Salon",
    summary:
      "Een rustige presentatie voor een salon, met behandelingen en een duidelijke route naar reserveren.",
    goals: [
      "Een rustige, verzorgde sfeer",
      "Behandelingen overzichtelijk naast elkaar",
      "Reserveren altijd binnen één tik bereikbaar",
    ],
    visual: [
      "Zachte, warme tinten en een sierlijke kopletter voor een kalme eerste indruk.",
      "Grote beeldvlakken voor sfeerfoto's zodra die zijn aangeleverd.",
    ],
    functional: [
      "Behandelingen als lijst met korte uitleg per behandeling.",
      "De reserveerknop blijft op mobiel in beeld.",
    ],
    theme: "casa",
    liveUrl: null,
  },
  {
    slug: "bij-tanja",
    name: "Bij Tanja",
    status: "concept",
    kind: "Kaas- en delicatessenwinkel",
    summary:
      "Een warme presentatie voor een kaas- en delicatessenwinkel, met assortiment, sfeer, openingstijden en contact.",
    goals: [
      "Eigen winkelfoto's centraal",
      "Assortiment en sfeer direct zichtbaar",
      "Openingstijden en contact zonder zoeken",
    ],
    visual: [
      "Warme, ambachtelijke kleuren die passen bij een versspeciaalzaak.",
      "Ruimte voor eigen winkelfoto's in plaats van algemene beelden.",
    ],
    functional: [
      "Openingstijden en route bovenaan op mobiel.",
      "Assortiment in duidelijke groepen, zonder webshop.",
    ],
    theme: "tanja",
    liveUrl: null,
  },
];

/** Prijsvoorbeelden van andere aanbieders: momentopname, hercontroleren vóór publicatie. */
export const comparison = {
  checkedOn: "10 november 2026",
  rows: [
    {
      id: "bw",
      name: brand.name,
      detail: "Website + hosting en service",
      oneOff: pricing.oneOff,
      monthly: pricing.monthly,
      source: null as string | null,
      own: true,
    },
    {
      id: "lintema",
      name: "Lintema Compleet",
      detail: "Koop + optioneel onderhoud",
      oneOff: 1295,
      monthly: 39,
      source: "https://lintema.nl/prijzen/",
      own: false,
    },
    {
      id: "klikklaar",
      name: "KlikKlaar Website op maat",
      detail: "Tot vijf pagina's + optionele hosting",
      oneOff: 949,
      monthly: 29,
      source: "https://klikklaarwebsites.nl/services",
      own: false,
    },
  ],
  illustrative: { oneOff: 4000, monthly: 50 },
};

export const nav = [
  { href: "/voorbeelden", label: "Voorbeelden" },
  { href: "/website-laten-maken", label: "Wat je krijgt" },
  { href: "/prijzen", label: "Prijzen" },
  { href: "/werkwijze", label: "Werkwijze" },
];

export const START_HREF = "/start";
