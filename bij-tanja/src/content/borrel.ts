/**
 * BORRELINSPIRATIE — combinaties om mee te spelen.
 * Dit zijn suggesties, geen vaste pakketten of voorraadbeloftes.
 */
export type Keuze = { id: string; label: string; zin: string; foto: string; focus: string; zoom?: number };

export const borrel = {
  kaas: [
    { id: "jong", label: "Jong & romig", zin: "een romige jonge kaas", foto: "kaaswand.jpg", focus: "62% 28%", zoom: 2.2 },
    { id: "oud", label: "Oud & pittig", zin: "een stevige oude kaas", foto: "kaastoonbank-weegschaal.jpg", focus: "30% 62%", zoom: 2 },
    { id: "kruiden", label: "Met een kruidje", zin: "een kaas met komijn of fenegriek", foto: "kaaswand.jpg", focus: "20% 55%", zoom: 2.2 },
    { id: "zacht", label: "Zacht of blauw", zin: "een zachte of blauwe kaas uit de koeling", foto: "koeling-delicatessen-bubbels.jpg", focus: "33% 52%", zoom: 2.4 },
  ],
  drank: [
    { id: "rood", label: "Rode wijn", zin: "een glas rode wijn", foto: "wijn-worstjes-sapjes.jpg", focus: "28% 35%", zoom: 2.2 },
    { id: "wit", label: "Witte wijn", zin: "een frisse witte wijn", foto: "wijn-worstjes-sapjes.jpg", focus: "34% 55%", zoom: 2.4 },
    { id: "bubbels", label: "Bubbels", zin: "iets met bubbels", foto: "koeling-delicatessen-bubbels.jpg", focus: "78% 12%", zoom: 2.4 },
    { id: "bier", label: "Speciaalbier", zin: "een lekker speciaalbiertje", foto: "speciaalbier-en-knabbels.jpg", focus: "92% 55%", zoom: 2 },
    { id: "sap", label: "Sapje", zin: "een vers sapje", foto: "sapjes-en-inpaktafel.jpg", focus: "22% 62%", zoom: 2 },
  ],
  knabbel: [
    { id: "noten", label: "Noten", zin: "een handje gebrande noten", foto: "notenbar-en-kaaswand.jpg", focus: "62% 82%", zoom: 2.4 },
    { id: "worst", label: "Worstjes", zin: "een paar plakjes worst", foto: "wijn-worstjes-sapjes.jpg", focus: "6% 32%", zoom: 2.6 },
    { id: "olijven", label: "Olijven", zin: "wat olijven en tapenade", foto: "koeling-delicatessen-bubbels.jpg", focus: "40% 20%", zoom: 2.4 },
    { id: "knabbels", label: "Knabbels", zin: "een bakje borrelknabbels", foto: "speciaalbier-en-knabbels.jpg", focus: "60% 45%", zoom: 2.2 },
  ],
} satisfies Record<string, Keuze[]>;

export const borrelZinnen = [
  (k: string, d: string, n: string) => `Wat dacht je van ${k}, met ${d} en ${n} erbij?`,
  (k: string, d: string, n: string) => `Vanavond op de plank: ${k}, ${n} en ${d}. Gezellig!`,
  (k: string, d: string, n: string) => `Neem ${k} mee, schenk ${d} in en zet ${n} op tafel. Klaar!`,
];
