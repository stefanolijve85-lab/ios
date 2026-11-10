/**
 * ASSORTIMENT — de categorieën van Bij Tanja
 * ------------------------------------------------------------
 * Alleen beschrijvingen die passen bij wat er echt in de winkel ligt.
 * Geen prijzen, merken of productclaims: die wisselen en staan op de
 * krijtbordjes in de winkel.
 *
 * `voorbeelden` = dingen die op de foto's van de winkel te zien zijn.
 */
export type Categorie = {
  slug: string;
  nummer: string;
  titel: string;
  kort: string;
  lang: string;
  vraag: string;
  foto: string;
  focus?: string;
  voorbeelden: string[];
};

export const categorieen: Categorie[] = [
  {
    slug: "kaas",
    nummer: "01",
    titel: "Heerlijke kazen",
    kort: "Jong, belegen, oud of met een kruidje. Van hele wielen tot een mooi stuk voor op de plank.",
    lang: "De kaaswand is het hart van de winkel. Van een romige jonge kaas voor op brood tot een stevige oude voor bij de borrel, en kazen met komijn, nagel, brandnetel of fenegriek. In de koeling liggen ook zachte en blauwe kazen. Twijfel je? Vraag gerust wat we je aanraden.",
    vraag: "Zin in kaas?",
    foto: "kaaswand.jpg",
    focus: "50% 40%",
    voorbeelden: ["Jonge en belegen kaas", "Oude en extra belegen kaas", "Kruidenkazen", "Boerenkaas", "Zachte en blauwe kazen uit de koeling"],
  },
  {
    slug: "wijn",
    nummer: "02",
    titel: "Wijnen & bubbels",
    kort: "Rood, wit, rosé en iets met bubbels. Voor bij het eten, op de borrel of als cadeau.",
    lang: "Een flinke kast vol rode, witte en rosé wijnen, en bovenop staan de bubbels. Voor gewoon een gezellige avond of iets feestelijks om cadeau te geven. Bij elke fles staat een krijtbordje met wat uitleg, en anders vertellen we je er graag meer over.",
    vraag: "Iets lekkers erbij?",
    foto: "wijn-worstjes-sapjes.jpg",
    focus: "25% 55%",
    voorbeelden: ["Rode wijn", "Witte wijn", "Rosé", "Mousserende wijn en bubbels", "Mooie flessen in cadeauverpakking"],
  },
  {
    slug: "bier-sap",
    nummer: "03",
    titel: "Speciaalbier & sapjes",
    kort: "Tripel, weizen, IPA of quadrupel. En voor wie liever iets fris wil: lekkere sapjes.",
    lang: "Bovenop de kasten staat een vrolijke rij speciaalbieren: van blond en weizen tot IPA, tripel en quadrupel. Liever geen alcohol? Dan is er een rek vol sappen in allerlei smaken, mooi in glazen flessen.",
    vraag: "Proost!",
    foto: "speciaalbier-en-knabbels.jpg",
    focus: "82% 45%",
    voorbeelden: ["Blond en weizen", "IPA", "Tripel en quadrupel", "Sappen in glazen flessen"],
  },
  {
    slug: "noten",
    nummer: "04",
    titel: "Noten & knabbels",
    kort: "Vers gebrande noten uit de toonbank en kasten vol borrelknabbels.",
    lang: "Achter het glas van de lange toonbank liggen de noten, en de kasten staan vol knabbels: borrelmixen, crackertjes, rijstzoutjes en nog veel meer. Je kiest zelf hoeveel je wilt, en we scheppen het voor je af.",
    vraag: "Knabbelen?",
    foto: "notenbar-en-kaaswand.jpg",
    focus: "55% 70%",
    voorbeelden: ["Gebrande en gezouten noten", "Borrelmixen", "Crackers en knabbels", "Noten in zakjes om mee te nemen"],
  },
  {
    slug: "snoep",
    nummer: "05",
    titel: "Snoep & zoetigheid",
    kort: "Chocolade, snoepjes, candy sticks en lolly's. Hier word je weer even kind.",
    lang: "Een hele wand met bakjes chocolade en zoetigheid, plus een rek vol candy sticks, lolly's en snoepzakken. Leuk voor jezelf, maar ook om iemand mee te verrassen.",
    vraag: "Iets zoets?",
    foto: "snoep-en-knabbels-wand.jpg",
    focus: "22% 50%",
    voorbeelden: ["Chocolade en bonbons in bakjes", "Candy sticks en lolly's", "Snoepzakken", "Zoete cadeautjes"],
  },
  {
    slug: "delicatessen",
    nummer: "06",
    titel: "Worstjes & delicatessen",
    kort: "Worstjes aan de haak, olijven en spreads uit de koeling, en lekkere potjes en pakjes.",
    lang: "Aan de haak hangen de worstjes, de koeling staat vol olijven, tapenades en andere lekkernijen, en in de houten kasten vind je potjes, koekjes en andere delicatessen. Precies die dingen die een borrel of een cadeau af maken.",
    vraag: "Iets bijzonders?",
    foto: "koeling-delicatessen-bubbels.jpg",
    focus: "35% 40%",
    voorbeelden: ["Worstjes", "Olijven en tapenades", "Spreads en dips", "Jam, potjes en koekjes"],
  },
  {
    slug: "cadeaus",
    nummer: "07",
    titel: "Cadeaus & cadeaupakketten",
    kort: "Feestelijk ingepakt, met een strik erom. Voor elke gelegenheid, of gewoon zomaar.",
    lang: "Op de tafel in het midden van de winkel staan kant-en-klare cadeautjes en pakketten met kaas, noten, wijn en snoep. Aan de inpaktafel liggen rollen lint in alle kleuren. Zoek je iets voor iemand speciaal? Vraag gerust wat er mogelijk is.",
    vraag: "Cadeautje?",
    foto: "cadeaupakketten-tafel.jpg",
    focus: "50% 40%",
    voorbeelden: ["Kant-en-klare cadeaupakketten", "Borrelpakketjes", "Cadeauflessen", "Mooi ingepakt met lint"],
  },
];
