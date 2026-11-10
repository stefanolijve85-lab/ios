import Link from "@/components/Lnk";
import { Check } from "lucide-react";
import { PaginaKop } from "@/components/PaginaKop";
import { Foto } from "@/components/Foto";
import { Reveal } from "@/components/Reveal";
import { Krijtbordje } from "@/components/Krijtbordje";
import { Langskomen } from "@/components/Langskomen";
import { categorieen } from "@/content/assortiment";
import { paginaMeta } from "@/lib/seo";

export const metadata = paginaMeta({
  titel: "Assortiment: kaas, wijn, noten, snoep & delicatessen",
  beschrijving:
    "Ontdek het assortiment van Bij Tanja in Emmen: kaas, wijnen en bubbels, speciaalbier en sapjes, noten en knabbels, snoep, worstjes, delicatessen en cadeaupakketten.",
  pad: "/assortiment",
  foto: "kaaswand.jpg",
});

export default function AssortimentPagina() {
  return (
    <>
      <PaginaKop
        kruimel="Assortiment"
        label="Zin in iets lekkers?"
        titel={<>Al het lekkers <em className="text-honey-soft">op een rij</em></>}
        intro="Kaas natuurlijk, maar ook wijn, bubbels, speciaalbier, noten, snoep, worstjes en cadeautjes. Loop maar even mee langs de kasten."
        foto="winkel-overzicht.jpg"
      />

      {/* Snelle categorie-navigatie */}
      <nav aria-label="Categorieën" className="sticky top-[var(--header-h)] z-30 border-b border-ink/10 bg-room/90 backdrop-blur-md">
        <ul className="no-scrollbar mx-auto flex max-w-page gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-10">
          {categorieen.map((c) => (
            <li key={c.slug} className="shrink-0">
              <a href={`#${c.slug}`} className="inline-flex min-h-[2.5rem] items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-inset ring-ink/15 transition-colors hover:bg-olive hover:text-room hover:ring-olive">
                {c.titel}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grain relative bg-room">
        {categorieen.map((c, i) => {
          const rechts = i % 2 === 1;
          return (
            <section
              key={c.slug}
              id={c.slug}
              aria-labelledby={`${c.slug}-titel`}
              className="relative mx-auto grid max-w-page scroll-mt-[calc(var(--header-h)+4rem)] items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-12 md:py-28 lg:px-10"
            >
              <Reveal className={`relative md:col-span-7 ${rechts ? "md:order-2 md:col-start-6" : ""}`}>
                <Foto
                  bestand={c.foto}
                  focus={c.focus}
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className={`rounded-[2px] ${i % 3 === 0 ? "aspect-[4/5] sm:aspect-[5/4]" : "aspect-[4/3]"}`}
                />
                <Krijtbordje className={`absolute -bottom-4 ${rechts ? "left-4 rotate-2" : "right-4 -rotate-2"}`}>{c.vraag}</Krijtbordje>
              </Reveal>
              <Reveal delay={0.08} className={`md:col-span-5 ${rechts ? "md:order-1" : "md:col-start-8 md:col-span-5"}`}>
                <span className="display text-4xl italic text-wood">{c.nummer}</span>
                <h2 id={`${c.slug}-titel`} className="display mt-2 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] text-olive-deep">
                  {c.titel}
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-ink">{c.lang}</p>
                <h3 className="label mt-8 text-ink-soft">Je vindt hier onder andere</h3>
                <ul className="mt-4 space-y-2.5">
                  {c.voorbeelden.map((v) => (
                    <li key={v} className="flex items-start gap-3 text-ink-soft">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-bordeaux" aria-hidden /> {v}
                    </li>
                  ))}
                </ul>
                {c.slug === "cadeaus" && (
                  <Link href="/cadeaus" className="btn btn-bordeaux mt-8">Alles over cadeaus</Link>
                )}
              </Reveal>
            </section>
          );
        })}
        <p className="relative mx-auto max-w-page px-4 pb-20 text-sm text-ink-soft sm:px-6 lg:px-10">
          Het assortiment wisselt met de seizoenen. Prijzen staan op de krijtbordjes in de winkel.
        </p>
      </div>

      <Langskomen />
    </>
  );
}
