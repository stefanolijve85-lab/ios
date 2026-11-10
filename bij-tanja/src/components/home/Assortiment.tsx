import Link from "@/components/Lnk";
import { ArrowUpRight } from "lucide-react";
import { Foto } from "../Foto";
import { Reveal } from "../Reveal";
import { Krijtbordje } from "../Krijtbordje";
import { categorieen, type Categorie } from "@/content/assortiment";
import { teksten } from "@/content/teksten";

/** Redactionele indeling: elke categorie een eigen formaat en plek. */
const indeling: Record<string, { kaart: string; beeld: string; sizes: string }> = {
  kaas: { kaart: "md:col-span-7", beeld: "aspect-[4/5] md:aspect-[5/6]", sizes: "(min-width: 768px) 58vw, 100vw" },
  wijn: { kaart: "md:col-span-5 md:mt-40", beeld: "aspect-[4/3] md:aspect-[4/5]", sizes: "(min-width: 768px) 42vw, 100vw" },
  "bier-sap": { kaart: "md:col-span-4 md:-mt-10", beeld: "aspect-[3/4]", sizes: "(min-width: 768px) 34vw, 100vw" },
  noten: { kaart: "md:col-span-8 md:mt-24", beeld: "aspect-[16/11]", sizes: "(min-width: 768px) 66vw, 100vw" },
  snoep: { kaart: "md:col-span-5", beeld: "aspect-square", sizes: "(min-width: 768px) 42vw, 100vw" },
  delicatessen: { kaart: "md:col-span-6 md:col-start-7 md:mt-32", beeld: "aspect-[4/3]", sizes: "(min-width: 768px) 50vw, 100vw" },
};

export function Assortiment() {
  const t = teksten.assortiment;
  const gewoon = categorieen.filter((c) => c.slug !== "cadeaus");
  const cadeau = categorieen.find((c) => c.slug === "cadeaus")!;
  return (
    <section id="assortiment" aria-labelledby="assortiment-titel" className="grain relative bg-room py-24 md:py-36">
      <div className="relative mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-7">
            <p className="label text-bordeaux">{t.label}</p>
            <h2 id="assortiment-titel" className="display mt-5 text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.98] text-olive-deep">
              {t.titel}
            </h2>
          </Reveal>
          <Reveal className="md:col-span-4 md:col-start-9" delay={0.1}>
            <p className="text-lg leading-relaxed text-ink-soft">{t.intro}</p>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-x-8 gap-y-16 md:mt-24 md:grid-cols-12 md:gap-y-12">
          {gewoon.map((c, i) => (
            <Reveal as="li" key={c.slug} className={indeling[c.slug]?.kaart} delay={(i % 2) * 0.08}>
              <Kaart c={c} beeld={indeling[c.slug]?.beeld} sizes={indeling[c.slug]?.sizes} />
            </Reveal>
          ))}
          <Reveal as="li" className="md:col-span-12 md:mt-20">
            <Link href={`/cadeaus`} className="group relative block overflow-hidden rounded-[2px]">
              <Foto
                bestand={cadeau.foto}
                focus={cadeau.focus}
                sizes="100vw"
                className="aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9]"
                imgClassName="transition-transform duration-[1.4s] ease-soft group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a0f14]/85 via-[#2a0f14]/20 to-transparent md:bg-gradient-to-r md:from-[#2a0f14]/85 md:via-[#2a0f14]/30" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-room sm:p-10 md:inset-y-0 md:right-auto md:flex md:max-w-xl md:flex-col md:justify-center md:p-14">
                <span className="display text-3xl italic text-honey-soft">{cadeau.nummer}</span>
                <h3 className="display mt-2 text-4xl leading-tight md:text-6xl">{cadeau.titel}</h3>
                <p className="mt-4 max-w-md text-room/85">{cadeau.kort}</p>
                <span className="btn btn-honey mt-7 self-start">
                  Ontdek meer <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}

function Kaart({ c, beeld = "aspect-[4/3]", sizes = "100vw" }: { c: Categorie; beeld?: string; sizes?: string }) {
  return (
    <Link href={`/assortiment#${c.slug}`} className="group block">
      <div className="relative">
        <Foto
          bestand={c.foto}
          focus={c.focus}
          sizes={sizes}
          className={`${beeld} rounded-[2px] bg-room-deep`}
          imgClassName="transition-transform duration-[1.4s] ease-soft group-hover:scale-[1.06]"
        />
        <Krijtbordje className="absolute -bottom-4 right-4 -rotate-3 transition-transform duration-500 ease-soft group-hover:-translate-y-1 group-hover:rotate-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
          {c.vraag}
        </Krijtbordje>
      </div>
      <div className="mt-6 flex gap-4">
        <span className="display pt-1 text-2xl italic text-wood">{c.nummer}</span>
        <div>
          <h3 className="display text-[1.9rem] leading-tight text-olive-deep md:text-[2.2rem]">{c.titel}</h3>
          <p className="mt-2 max-w-md leading-relaxed text-ink-soft">{c.kort}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-bordeaux">
            <span className="link-underline">Ontdek meer</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
