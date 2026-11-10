/** Datamodel, keuzelijsten, servervalidatie en volledigheidscheck voor de intake. */

export const SCHEMA_VERSION = 1;

type Opt = { id: string; label: string; hint?: string };

export const SECTORS: Opt[] = [
  { id: "winkel", label: "Winkel" },
  { id: "beauty", label: "Beauty & wellness" },
  { id: "diensten", label: "Zakelijke diensten" },
  { id: "bouw", label: "Bouw & installatie" },
  { id: "horeca", label: "Horeca" },
  { id: "anders", label: "Anders" },
];

export const ACTIONS: Opt[] = [
  { id: "bellen", label: "Bellen" },
  { id: "whatsapp", label: "WhatsApp sturen" },
  { id: "offerte", label: "Offerte aanvragen" },
  { id: "afspraak", label: "Afspraak aanvragen" },
  { id: "bezoek", label: "Winkel bezoeken" },
  { id: "anders", label: "Iets anders" },
];

export const STYLES: Opt[] = [
  { id: "strak", label: "Strak & zakelijk", hint: "Heldere lijnen, veel structuur" },
  { id: "warm", label: "Warm & persoonlijk", hint: "Zachte vormen, mens centraal" },
  { id: "luxe", label: "Luxe & rustig", hint: "Veel ruimte, sierlijke letters" },
  { id: "fris", label: "Fris & modern", hint: "Lichte vlakken, ronde knoppen" },
  { id: "stoer", label: "Stoer & krachtig", hint: "Grote koppen, hoog contrast" },
  { id: "speels", label: "Speels & kleurrijk", hint: "Losse vormen, vrolijke kleuren" },
];

export const PALETTES: { id: string; label: string; colors: [string, string, string] }[] = [
  { id: "marine", label: "Marine & helderblauw", colors: ["#0b1f3a", "#1f6feb", "#f7f4ee"] },
  { id: "bos", label: "Bosgroen & zand", colors: ["#1f3d2f", "#c8a66a", "#f6f1e7"] },
  { id: "terracotta", label: "Terracotta & crème", colors: ["#7a3b24", "#d9773f", "#fbf3ea"] },
  { id: "roze", label: "Zachtroze & taupe", colors: ["#5b4640", "#d8a7a0", "#fbf5f2"] },
  { id: "grafiet", label: "Grafiet & geel", colors: ["#1e2124", "#f2b705", "#f4f4f2"] },
  { id: "oceaan", label: "Oceaan & mint", colors: ["#0f4c5c", "#5fd0b5", "#f1f8f6"] },
];

export const PAGES: Opt[] = [
  { id: "home", label: "Home" },
  { id: "over", label: "Over ons" },
  { id: "diensten", label: "Diensten" },
  { id: "assortiment", label: "Assortiment" },
  { id: "projecten", label: "Projecten" },
  { id: "faq", label: "Veelgestelde vragen" },
  { id: "contact", label: "Contact" },
];

export const FEATURES: Opt[] = [
  { id: "contactformulier", label: "Contactformulier" },
  { id: "whatsapp", label: "WhatsApp-knop" },
  { id: "galerij", label: "Fotogalerij" },
  { id: "route", label: "Route-link" },
  { id: "afspraakaanvraag", label: "Afspraakaanvraag", hint: "Een formulier, geen gekoppelde agenda" },
  { id: "boekingslink", label: "Link naar extern boekingssysteem" },
];

/** Altijd apart beoordelen: geen automatische €99-dekking of 7-dagenbelofte. */
export const EXTRA_FEATURES: Opt[] = [
  { id: "webshop", label: "Webshop" },
  { id: "betalingen", label: "Online betalingen" },
  { id: "boekingsintegratie", label: "Live gekoppelde agenda/boekingen" },
  { id: "leden", label: "Ledenomgeving" },
  { id: "koppelingen", label: "Koppeling met andere software" },
];

/** Branchevragen: alleen relevante velden per branche. */
export const SECTOR_QUESTIONS: Record<string, { id: string; label: string; example: string }[]> = {
  winkel: [
    { id: "assortiment", label: "Welke productgroepen wil je laten zien?", example: "Bijv. kazen, noten, wijn, cadeaupakketten" },
    { id: "route", label: "Hoe vinden klanten je winkel (parkeren, ingang)?", example: "Bijv. gratis parkeren voor de deur" },
  ],
  beauty: [
    { id: "behandelingen", label: "Welke behandelingen bied je aan?", example: "Bijv. gezichtsbehandeling, manicure, massage" },
    { id: "tarieven", label: "Wil je tarieven tonen? Zo ja, welke?", example: "Bijv. gezichtsbehandeling vanaf €45" },
    { id: "afspraakroute", label: "Hoe maken klanten nu een afspraak?", example: "Bijv. via WhatsApp of een bestaand boekingssysteem" },
  ],
  diensten: [
    { id: "werkgebied", label: "In welk gebied werk je?", example: "Bijv. Drenthe en Groningen, of heel Nederland" },
    { id: "projecten", label: "Welke projecten of opdrachten wil je laten zien?", example: "Bijv. drie recente opdrachten met korte uitleg" },
  ],
  bouw: [
    { id: "werkgebied", label: "In welk gebied werk je?", example: "Bijv. binnen 40 km rond je vestigingsplaats" },
    { id: "projecten", label: "Welke projecten wil je laten zien?", example: "Bijv. badkamerrenovatie, dakkapel, aanbouw" },
  ],
  horeca: [
    { id: "kaart", label: "Wil je een menukaart tonen? Hoe lever je die aan?", example: "Bijv. als pdf, of als tekst per gang" },
    { id: "reserveren", label: "Hoe reserveren gasten nu?", example: "Bijv. telefonisch of via een bestaand systeem" },
  ],
  anders: [],
};

export type Offering = { name: string; description: string; distinction: string; price: string };
export type Inspiration = { url: string; note: string };

export type Intake = {
  business: {
    sector: string;
    sectorOther: string;
    siteType: "" | "nieuw" | "vervanging";
    existingUrl: string;
    offerings: Offering[];
    identity: "" | "beide" | "naam" | "geen";
    businessName: string;
    missingIdentity: "" | "later" | "naamlogo";
    keepName: "" | "ja" | "nee";
  };
  goals: {
    primaryAction: string;
    actionOther: string;
    secondaryAction: string;
    customerType: "" | "particulier" | "zakelijk" | "beide";
    audience: string;
    area: string;
    language: string;
    differentiators: string;
  };
  design: {
    styles: string[];
    leadStyle: string;
    styleAdvice: boolean;
    avoid: string;
    palette: string;
    customColors: string;
    mode: "" | "licht" | "donker" | "advies";
    imagery: "" | "foto" | "tekst" | "advies";
    motion: "" | "subtiel" | "geen" | "advies";
    inspiration: Inspiration[];
  };
  content: {
    pages: string[];
    pagesAdvice: boolean;
    about: string;
    phone: string;
    email: string;
    address: string;
    addressPublic: "" | "ja" | "nee";
    hours: string;
    socials: string;
    domain: string;
    mustHave: string;
    mustNotPublish: string;
    texts: "" | "zelf" | "bestaand" | "voorstel";
    languages: string;
    sectorAnswers: Record<string, string>;
  };
  media: {
    photos: "" | "upload" | "later" | "bespreken";
    rightsConfirmed: boolean;
    referencesConsent: "" | "ja" | "nee";
    features: string[];
    extraFeatures: string[];
    bookingProvider: string;
    integrationNotes: string;
  };
  naming: {
    tone: string;
    promise: string;
    language: string;
    wordsYes: string;
    wordsNo: string;
    nameStyle: string;
    logoType: "" | "woordmerk" | "beeldmerk" | "advies";
    colorPrefs: string;
    uses: string;
  };
  extras: { nameLogo: boolean };
  billing: { contactName: string; email: string; phone: string; companyName: string; notes: string };
};

export function emptyIntake(): Intake {
  return {
    business: { sector: "", sectorOther: "", siteType: "", existingUrl: "", offerings: [], identity: "", businessName: "", missingIdentity: "", keepName: "" },
    goals: { primaryAction: "", actionOther: "", secondaryAction: "", customerType: "", audience: "", area: "", language: "", differentiators: "" },
    design: { styles: [], leadStyle: "", styleAdvice: false, avoid: "", palette: "", customColors: "", mode: "", imagery: "", motion: "", inspiration: [] },
    content: { pages: [], pagesAdvice: false, about: "", phone: "", email: "", address: "", addressPublic: "", hours: "", socials: "", domain: "", mustHave: "", mustNotPublish: "", texts: "", languages: "", sectorAnswers: {} },
    media: { photos: "", rightsConfirmed: false, referencesConsent: "", features: [], extraFeatures: [], bookingProvider: "", integrationNotes: "" },
    naming: { tone: "", promise: "", language: "", wordsYes: "", wordsNo: "", nameStyle: "", logoType: "", colorPrefs: "", uses: "" },
    extras: { nameLogo: false },
    billing: { contactName: "", email: "", phone: "", companyName: "", notes: "" },
  };
}

/* ---------- Servervalidatie: alles wat binnenkomt is onbetrouwbaar ---------- */

const LIMIT = { short: 160, long: 2000 };

function str(v: unknown, max = LIMIT.short): string {
  if (typeof v !== "string") return "";
  // Verwijder besturingstekens (behalve regeleinde/tab) en kap af.
  return v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max).trim();
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | "" {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : "";
}
function many(v: unknown, allowed: string[], max: number): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === "string" && allowed.includes(x)))].slice(0, max);
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
const ids = (o: { id: string }[]) => o.map((x) => x.id);

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
export function isEmail(v: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v);
}

/** Maakt van willekeurige invoer een geldige Intake. Onbekende velden vervallen. */
export function sanitizeIntake(input: unknown): Intake {
  const i = obj(input);
  const b = obj(i.business), g = obj(i.goals), d = obj(i.design), c = obj(i.content);
  const m = obj(i.media), n = obj(i.naming), e = obj(i.extras), bill = obj(i.billing);

  const offerings = (Array.isArray(b.offerings) ? b.offerings : []).slice(0, 20).map((o) => {
    const x = obj(o);
    return { name: str(x.name), description: str(x.description, 600), distinction: str(x.distinction, 300), price: str(x.price, 60) };
  }).filter((o) => o.name);

  const inspiration = (Array.isArray(d.inspiration) ? d.inspiration : []).slice(0, 3).map((o) => {
    const x = obj(o);
    return { url: str(x.url, 300), note: str(x.note, 300) };
  }).filter((o) => o.url && isHttpUrl(o.url));

  const styles = many(d.styles, ids(STYLES), 2);
  const sector = oneOf(b.sector, ids(SECTORS));
  const sa = obj(c.sectorAnswers);
  const sectorAnswers: Record<string, string> = {};
  // Bewaar antwoorden van alle branches (de klant beslist of ze vervallen), maar alleen bekende sleutels.
  for (const [sec, qs] of Object.entries(SECTOR_QUESTIONS)) {
    for (const q of qs) {
      const key = `${sec}.${q.id}`;
      const val = str(sa[key], 800);
      if (val) sectorAnswers[key] = val;
    }
  }
  const existingUrl = str(b.existingUrl, 300);

  return {
    business: {
      sector,
      sectorOther: str(b.sectorOther),
      siteType: oneOf(b.siteType, ["nieuw", "vervanging"] as const),
      existingUrl: existingUrl && isHttpUrl(existingUrl) ? existingUrl : "",
      offerings,
      identity: oneOf(b.identity, ["beide", "naam", "geen"] as const),
      businessName: str(b.businessName, 80).replace(/\s+/g, " "),
      missingIdentity: oneOf(b.missingIdentity, ["later", "naamlogo"] as const),
      keepName: oneOf(b.keepName, ["ja", "nee"] as const),
    },
    goals: {
      primaryAction: oneOf(g.primaryAction, ids(ACTIONS)),
      actionOther: str(g.actionOther),
      secondaryAction: oneOf(g.secondaryAction, ids(ACTIONS)),
      customerType: oneOf(g.customerType, ["particulier", "zakelijk", "beide"] as const),
      audience: str(g.audience, 600),
      area: str(g.area),
      language: str(g.language, 80),
      differentiators: str(g.differentiators, LIMIT.long),
    },
    design: {
      styles,
      leadStyle: styles.includes(str(d.leadStyle)) ? str(d.leadStyle) : styles[0] ?? "",
      styleAdvice: d.styleAdvice === true,
      avoid: str(d.avoid, 400),
      palette: oneOf(d.palette, [...PALETTES.map((p) => p.id), "eigen", "logo", "advies"]),
      customColors: str(d.customColors, 200),
      mode: oneOf(d.mode, ["licht", "donker", "advies"] as const),
      imagery: oneOf(d.imagery, ["foto", "tekst", "advies"] as const),
      motion: oneOf(d.motion, ["subtiel", "geen", "advies"] as const),
      inspiration,
    },
    content: {
      pages: many(c.pages, ids(PAGES), PAGES.length),
      pagesAdvice: c.pagesAdvice === true,
      about: str(c.about, LIMIT.long),
      phone: str(c.phone, 40),
      email: str(c.email, 200),
      address: str(c.address, 200),
      addressPublic: oneOf(c.addressPublic, ["ja", "nee"] as const),
      hours: str(c.hours, 600),
      socials: str(c.socials, 400),
      domain: str(c.domain, 120),
      mustHave: str(c.mustHave, 800),
      mustNotPublish: str(c.mustNotPublish, 800),
      texts: oneOf(c.texts, ["zelf", "bestaand", "voorstel"] as const),
      languages: str(c.languages, 120),
      sectorAnswers,
    },
    media: {
      photos: oneOf(m.photos, ["upload", "later", "bespreken"] as const),
      rightsConfirmed: m.rightsConfirmed === true,
      referencesConsent: oneOf(m.referencesConsent, ["ja", "nee"] as const),
      features: many(m.features, ids(FEATURES), FEATURES.length),
      extraFeatures: many(m.extraFeatures, ids(EXTRA_FEATURES), EXTRA_FEATURES.length),
      bookingProvider: str(m.bookingProvider, 120),
      integrationNotes: str(m.integrationNotes, 800),
    },
    naming: {
      tone: str(n.tone, 300), promise: str(n.promise, 400), language: str(n.language, 80),
      wordsYes: str(n.wordsYes, 300), wordsNo: str(n.wordsNo, 300), nameStyle: str(n.nameStyle, 200),
      logoType: oneOf(n.logoType, ["woordmerk", "beeldmerk", "advies"] as const),
      colorPrefs: str(n.colorPrefs, 300), uses: str(n.uses, 300),
    },
    // Een extra is alleen actief als de klant er zelf expliciet voor koos.
    extras: { nameLogo: e.nameLogo === true },
    billing: {
      contactName: str(bill.contactName, 120),
      email: str(bill.email, 200),
      phone: str(bill.phone, 40),
      companyName: str(bill.companyName, 160),
      notes: str(bill.notes, 800),
    },
  };
}

export const label = (list: { id: string; label: string }[], id: string) =>
  list.find((x) => x.id === id)?.label ?? id;

/* ---------- Volledigheid: checklist is leidend, geen procentmeter ---------- */

export type Missing = { key: string; label: string; critical: boolean };

export function missingFields(i: Intake, assetCount = 0): Missing[] {
  const out: Missing[] = [];
  const add = (key: string, label: string, critical = true) => out.push({ key, label, critical });

  const hasName = !!i.business.businessName;
  const namingTrack = i.extras.nameLogo;
  if (!hasName && !namingTrack) add("business.identity", "Bedrijfsnaam (of een gekozen naamtraject)");
  if (namingTrack && !i.naming.tone && !i.naming.promise)
    add("naming", "Naam/logo: gewenste toon of merkbelofte");
  if (!i.business.sector) add("business.sector", "Branche");
  if (i.business.offerings.length === 0) add("business.offerings", "Aanbod: minstens één dienst of product");
  if (!i.goals.audience && !i.goals.customerType) add("goals.audience", "Doelgroep");
  if (!i.goals.primaryAction) add("goals.primaryAction", "Primaire actie voor de bezoeker");
  if (!i.content.phone && !i.content.email) add("content.contact", "Contactroute: telefoon of e-mail voor op de website");
  if (i.design.styles.length === 0 && !i.design.styleAdvice) add("design.styles", "Stijlkeuze (of 'Adviseer mij')");
  if (i.content.pages.length === 0 && !i.content.pagesAdvice) add("content.pages", "Gewenste pagina's (of 'Adviseer mij')");
  if (!i.content.texts) add("content.texts", "Hoe de teksten worden aangeleverd");
  if (!i.media.photos) add("media.photos", "Foto's: aanleveren, later of bespreken");
  if (assetCount > 0 && !i.media.rightsConfirmed) add("media.rights", "Bevestiging dat aangeleverd materiaal gebruikt mag worden");
  if (i.media.extraFeatures.length > 0)
    add("media.extraFeatures", "Maatwerkfuncties gekozen: eerst beoordeling en prijsafspraak", true);

  // Niet-kritiek: handig, maar blokkeert 'bouwklaar' niet.
  if (!i.design.palette) add("design.palette", "Kleurvoorkeur", false);
  if (!i.content.hours && ["winkel", "beauty", "horeca"].includes(i.business.sector)) add("content.hours", "Openingstijden", false);
  if (!i.goals.differentiators) add("goals.differentiators", "Wat je bedrijf anders maakt", false);
  if (i.business.identity === "naam" && assetCount === 0 && !namingTrack && i.business.missingIdentity !== "later")
    add("business.logo", "Logo: aanleveren, later of laten maken", false);
  return out;
}

export const criticalMissing = (i: Intake, assetCount = 0) => missingFields(i, assetCount).filter((m) => m.critical);

export const STATUSES = [
  "concept", "ingediend", "input_ontbreekt", "klaar_voor_beoordeling",
  "goedgekeurd_voor_bouw", "in_productie", "opgeleverd",
] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
  concept: "Concept", ingediend: "Ingediend", input_ontbreekt: "Input ontbreekt",
  klaar_voor_beoordeling: "Klaar voor beoordeling", goedgekeurd_voor_bouw: "Goedgekeurd voor bouw",
  in_productie: "In productie", opgeleverd: "Opgeleverd",
};
/** Statussen waarvoor de essentiële checklist leeg moet zijn. */
export const BUILD_STATUSES: Status[] = ["goedgekeurd_voor_bouw", "in_productie", "opgeleverd"];

export const PAYMENT_STATUSES = ["niet_gestart", "factuur_verstuurd", "betaald"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  niet_gestart: "Niet gestart", factuur_verstuurd: "Factuur verstuurd", betaald: "Betaald (handmatig bevestigd)",
};
