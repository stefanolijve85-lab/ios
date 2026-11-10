import { PaginaKop } from "@/components/PaginaKop";
import { Cadeau } from "@/components/home/Cadeau";
import { Galerij } from "@/components/Galerij";
import { Reveal } from "@/components/Reveal";
import { Langskomen } from "@/components/Langskomen";
import { fotos } from "@/content/fotos";
import { paginaMeta } from "@/lib/seo";

export const metadata = paginaMeta({
  titel: "Cadeaus & cadeaupakketten in Emmen",
  beschrijving:
    "Iemand verrassen? Bij Tanja in Winkelcentrum Angelslo, Emmen vind je cadeautjes en cadeaupakketten met kaas, noten, wijn en snoep, feestelijk ingepakt.",
  pad: "/cadeaus",
  foto: "cadeaupakketten-tafel.jpg",
});

// Controleer deze stappen met Tanja.
const stappen = [
  { n: "1", titel: "Vertel voor wie het is", tekst: "Kom langs en vertel voor wie je iets zoekt en waar diegene van houdt." },
  { n: "2", titel: "Kies samen iets lekkers", tekst: "Kaas, noten, iets te drinken of juist iets zoets: we denken graag met je mee." },
  { n: "3", titel: "Mooi ingepakt mee", tekst: "Met een strik erom, klaar om te geven." },
];

const cadeauFotos = fotos.filter((f) => ["cadeaus", "delicatessen", "wijn", "snoep"].includes(f.categorie));

export default function CadeausPagina() {
  return (
    <>
      <PaginaKop
        kruimel="Cadeaus"
        label="Zoek je een leuk cadeautje?"
        titel={<>Lekker <em className="text-honey-soft">om te geven</em></>}
        intro="Voor een verjaardag, als bedankje, met de feestdagen of gewoon zomaar. Een cadeautje van Tanja maakt iemand blij."
        foto="cadeaupakketten-tafel.jpg"
        focus="50% 35%"
      />
      <Cadeau toonLink={false} />

      <section aria-labelledby="stappen-titel" className="bg-room py-24 md:py-32">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
          <Reveal>
            <p className="label text-bordeaux">Zo simpel is het</p>
            <h2 id="stappen-titel" className="display mt-5 text-[clamp(2.2rem,5vw,3.8rem)] leading-[1] text-olive-deep">
              Van idee tot <em className="text-bordeaux">strikje</em>
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {stappen.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.08} className="relative border-t border-ink/15 pt-8">
                <span className="display absolute -top-7 left-0 bg-room pr-4 text-5xl italic text-honey">{s.n}</span>
                <h3 className="display text-2xl text-olive-deep">{s.titel}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{s.tekst}</p>
              </Reveal>
            ))}
          </ol>

          <div className="mt-24">
            <Reveal>
              <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] text-olive-deep">Wat inspiratie uit de winkel</h2>
            </Reveal>
            <div className="mt-10">
              <Galerij fotos={cadeauFotos} />
            </div>
          </div>
        </div>
      </section>

      <Langskomen />
    </>
  );
}
