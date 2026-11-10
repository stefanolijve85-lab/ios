import { PaginaKop } from "@/components/PaginaKop";
import { MaakKennis } from "@/components/home/MaakKennis";
import { GalerijSectie } from "@/components/Galerij";
import { Langskomen } from "@/components/Langskomen";
import { Ribbon } from "@/components/Ribbon";
import { paginaMeta } from "@/lib/seo";
import { winkel } from "@/content/winkel";

export const metadata = paginaMeta({
  titel: "Over Tanja — persoonlijk advies en gezelligheid",
  beschrijving:
    "Maak kennis met Tanja van Bij Tanja in Winkelcentrum Angelslo, Emmen. Een winkel vol lekkers, met een vriendelijk hallo, tijd voor een praatje en eerlijk advies.",
  pad: "/over-tanja",
  foto: "tanja-in-de-deur.jpg",
});

export default function OverTanjaPagina() {
  return (
    <>
      <PaginaKop
        kruimel="Over Tanja"
        label="Even kennismaken"
        titel={<>Gezelligheid <em className="text-honey-soft">staat voorop</em></>}
        intro={winkel.kernboodschap}
        foto="winkel-entree-tanja.jpg"
        focus="70% 45%"
      />
      <MaakKennis toonLink={false} />
      <Ribbon tone="olive" />
      <GalerijSectie />
      <Langskomen />
    </>
  );
}
