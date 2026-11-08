/**
 * Centrale bedrijfs- en inhoudsgegevens van Casa Amoray.
 *
 * Alles wat nog niet bekend is staat op `null` of is gemarkeerd met
 * `placeholder: true`. Zulke onderdelen tonen een zichtbaar label "Tijdelijk"
 * zolang `showPlaceholderLabels` aan staat. Zet dat uit vlak voor livegang,
 * nadat alle tijdelijke teksten zijn vervangen.
 */

export const showPlaceholderLabels = true;

export const business = {
  name: "Casa Amoray",
  slogan: "Een moment voor jezelf",
  tagline: "Speciaal voor vrouwen en moeders",
  owner: "Winnie",
  city: "Emmen",
  country: "NL",
  street: "Hunenoord 20" as string | null,
  postalCode: "7822 BP" as string | null,
  /** Zoals getoond op de site */
  phone: "+31 6 15 28 45 47" as string | null,
  /** Voor tel:-links (zonder spaties) */
  phoneHref: "tel:+31615284547",
  // Nog onbekend: niet verzinnen. Vul in zodra bekend.
  email: "winnie@casaamoray.nl" as string | null,
  instagram: null as string | null,
  availabilityNote: "Casa Amoray is elke avond geopend van 18:00 tot 21:00.",
  /** Openingstijden: elke dag, 18:00–21:00. Gebruikt voor het formulier en Google (JSON-LD). */
  hours: { opens: "18:00", closes: "21:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
};

export type Treatment = {
  id: string;
  name: string;
  minutes: number;
  price: number | null;
  short: string;
  description: string;
  bookable: boolean;
  comingSoon?: boolean;
};

/**
 * Behandelingen. Nieuwe behandelingen (zoals headspa) voeg je hier toe;
 * zet `bookable: true` en `comingSoon: false` zodra ze reserveerbaar zijn.
 */
export const treatments: Treatment[] = [
  {
    id: "postpartum",
    name: "Postpartummassage",
    minutes: 60,
    price: 60,
    short: "Een rustig moment voor jou, in de periode na je bevalling.",
    description:
      "Een zachte, ontspannende massage voor moeders. Je ligt comfortabel en Winnie stemt de behandeling af op wat jij op dat moment prettig vindt. Even geen zorgen, alleen tijd voor jezelf.",
    bookable: true,
  },
  {
    id: "ontspanning",
    name: "Ontspanningsmassage",
    minutes: 60,
    price: 60,
    short: "Laat de drukte van de dag van je afglijden.",
    description:
      "Een weldadige massage in een rustige en warme ruimte. Vooraf bespreken jullie samen je wensen, zodat de massage helemaal bij jou past.",
    bookable: true,
  },
  {
    id: "deluxe",
    name: "Deluxe ontspanningsmassage",
    minutes: 90,
    price: 85,
    short: "Extra tijd om echt tot rust te komen.",
    description:
      "De uitgebreide variant van de ontspanningsmassage. Met een half uur extra is er alle ruimte om te vertragen en het moment echt te beleven.",
    bookable: true,
  },
  {
    id: "headspa",
    name: "Headspa",
    minutes: 0,
    price: null,
    short: "Een nieuwe behandeling, binnenkort bij Casa Amoray.",
    description: "",
    bookable: false,
    comingSoon: true,
  },
];

export const treatmentNote =
  "Je wordt persoonlijk ontvangen met een kopje thee en een rustig moment om je wensen te bespreken. Die kennismaking komt bovenop de massagetijd.";

/**
 * Cadeaubonnen: online bestellen en betalen (Mollie), of in de salon.
 * Waarden = de behandelingen met een vaste prijs, zodat er niets verzonnen wordt.
 */
export const giftCards = {
  intro:
    "Gun iemand anders een moment voor zichzelf. Een cadeaubon van Casa Amoray is een warm cadeau voor een nieuwe moeder, een vriendin of je eigen moeder.",
  ways: "Je bestelt en betaalt een cadeaubon hier online, of gewoon in de salon.",
  /** Hoe de koper de bon ontvangt. */
  delivery: [
    { id: "digitaal", label: "Digitaal per e-mail", hint: "Winnie stuurt de cadeaubon naar jouw e-mailadres." },
    { id: "salon", label: "Ophalen in de salon", hint: "Haal de cadeaubon op in de salon, elke avond tussen 18:00 en 21:00." },
  ],
  options: () => treatments.filter((t) => t.bookable && t.price !== null),
};

export const mapsHref = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Hunenoord 20, 7822 BP Emmen");

export const nav = [
  { label: "Home", href: "/#top" },
  { label: "Behandelingen", href: "/#behandelingen" },
  { label: "De beleving", href: "/#beleving" },
  { label: "Over Winnie", href: "/#over-winnie" },
  { label: "Cadeaubon", href: "/cadeaubon" },
  { label: "Contact", href: "/#contact" },
];

export const bookingHref = "/reserveren";

/**
 * Basis-URL voor SEO (canonical, sitemap, Open Graph).
 * - NEXT_PUBLIC_SITE_URL ingesteld (echt domein) -> die wordt gebruikt en de site mag in Google.
 * - Anders op Vercel het projectadres (bv. casa-amoray.vercel.app), maar NIET indexeren:
 *   zo komt de testversie met tijdelijke teksten niet in zoekresultaten.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || "http://localhost:3000").replace(/\/$/, "");
export const indexable = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

export const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
