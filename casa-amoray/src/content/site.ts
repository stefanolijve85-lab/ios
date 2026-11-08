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
  /** Uitgebreide uitleg ("Meer over deze behandeling"). Geen medische claims. */
  details?: {
    forWhom: string;
    expect: string;
    gives: string[];
    goodToKnow?: string;
  };
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
    details: {
      forWhom:
        "Voor moeders in de weken en maanden na de bevalling die even op adem willen komen. Een periode vol nieuwe indrukken, korte nachten en veel zorgen voor een ander: hier is er een uur alleen voor jou.",
      expect:
        "Bij een kopje thee vertel je hoe het met je gaat en wat je fijn vindt. Tijdens de massage ligt de nadruk op rust en ontspanning, met aandacht voor plekken die in deze periode veel te verduren hebben, zoals schouders, nek en onderrug. Winnie zorgt dat je comfortabel ligt en past de druk aan op wat voor jou prettig voelt.",
      gives: [
        "Een uur dat helemaal over jou gaat",
        "Ontspanning voor schouders, nek en rug die veel tillen, dragen en voeden",
        "Rust in je hoofd in een drukke, nieuwe periode",
        "Een moment om weer even bij jezelf stil te staan",
      ],
      goodToKnow:
        "Ben je bevallen met een keizersnede, of herstel je nog van de bevalling? Overleg dan eerst met je verloskundige of huisarts en vertel het Winnie vooraf.",
    },
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
    details: {
      forWhom:
        "Voor iedere vrouw die toe is aan rust: na een drukke werkweek, in een hectische periode of gewoon omdat je het jezelf gunt.",
      expect:
        "Je ligt onder zachte handdoeken in een rustige ruimte met gedempt licht. Met massageolie en rustige, vloeiende bewegingen helpt Winnie je spanning los te laten. Vooraf bespreken jullie welke plekken extra aandacht mogen krijgen en welke druk je prettig vindt.",
      gives: [
        "Spanning in schouders, nek en rug kan wegzakken",
        "Even helemaal loskomen van alles wat moet",
        "Een rustig, ontspannen gevoel dat je mee naar huis neemt",
      ],
      goodToKnow: "Heb je klachten of een blessure? Vertel het vooraf, dan houdt Winnie er rekening mee.",
    },
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
    details: {
      forWhom:
        "Voor wie echt de tijd wil nemen, of het extra bijzonder wil maken. Ook een mooi cadeau voor iemand die wel wat rust kan gebruiken.",
      expect:
        "Dezelfde rustige opbouw als de ontspanningsmassage, met een half uur extra. Daardoor is er ruimte voor een langzamer tempo en meer aandacht voor de plekken die het nodig hebben.",
      gives: [
        "Dieper tot rust komen door de extra tijd",
        "Geen haast: de massage vertraagt mee met jou",
        "Een moment om echt even helemaal weg te zijn",
      ],
    },
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

/** Zo verloopt je bezoek (alleen wat vaststaat). */
export const visitSteps = [
  { title: "Ontvangst", text: "Winnie ontvangt je persoonlijk in de rustige, huiselijke ontvangsthoek van de salon." },
  {
    title: "Thee en kennismaking",
    text: "Met een kopje thee bespreek je hoe het met je gaat en wat je wensen zijn. Deze tijd gaat niet af van je massage.",
  },
  { title: "Jouw massage", text: "60 of 90 minuten, afgestemd op jou, in een ruimte met zacht licht en rust." },
  { title: "Nagenieten", text: "Daarna neem je rustig de tijd om bij te komen, voordat je weer naar huis gaat." },
];

/** Veelgestelde vragen: alleen feiten die vaststaan. */
export const faqs = [
  {
    q: "Is Casa Amoray alleen voor vrouwen?",
    a: "Ja. Casa Amoray is er speciaal voor vrouwen en moeders.",
  },
  {
    q: "Wanneer kan ik terecht?",
    a: "Elke avond van 18:00 tot 21:00. Vraag je afspraak aan via de website, of bel of app naar +31 6 15 28 45 47.",
  },
  {
    q: "Wat kost een massage?",
    a: "De postpartummassage en de ontspanningsmassage duren 60 minuten en kosten € 60. De deluxe ontspanningsmassage duurt 90 minuten en kost € 85.",
  },
  {
    q: "Gaat de kennismaking met thee van mijn massagetijd af?",
    a: "Nee. Het kopje thee en het gesprek over je wensen komen bovenop de tijd van je massage.",
  },
  {
    q: "Ik ben net bevallen of heb klachten. Kan ik toch komen?",
    a: "Overleg bij twijfel eerst met je verloskundige of huisarts, en vertel het Winnie vooraf. Dan kan zij de behandeling daarop afstemmen.",
  },
  {
    q: "Kan ik een massage cadeau geven?",
    a: "Ja. Je bestelt een cadeaubon online of in de salon, en kiest of je hem digitaal ontvangt of ophaalt in de salon.",
  },
  {
    q: "Waar is de salon?",
    a: "Casa Amoray zit aan de Hunenoord 20, 7822 BP Emmen.",
  },
];

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
