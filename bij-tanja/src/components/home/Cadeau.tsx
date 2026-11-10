import Link from "next/link";
import { Gift } from "lucide-react";
import { Foto } from "../Foto";
import { Reveal } from "../Reveal";
import { teksten } from "@/content/teksten";

/** Scène 6 — een cadeautje van Tanja */
export function Cadeau({ toonLink = true }: { toonLink?: boolean }) {
  const t = teksten.cadeau;
  return (
    <section id="cadeau" aria-labelledby="cadeau-titel" className="relative overflow-hidden bg-bordeaux py-24 text-room md:py-36">
      {/* Lint dat over de sectie loopt */}
      <svg aria-hidden className="pointer-events-none absolute -left-10 top-10 h-[120%] w-[60%] opacity-[0.13]" viewBox="0 0 400 800" fill="none">
        <path d="M-20 40C120 140 60 300 200 360s120 260 40 420" stroke="#E9C77D" strokeWidth="26" strokeLinecap="round" />
      </svg>
      <div className="relative mx-auto grid max-w-page gap-14 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="relative md:col-span-6">
          <Reveal>
            <Foto bestand="cadeaupakketten-tafel.jpg" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] rounded-[2px]" />
          </Reveal>
          <Reveal delay={0.2} className="absolute -bottom-10 right-0 w-[52%] rotate-[3deg] sm:-right-6 md:-right-14">
            <div className="bg-room-paper p-2 pb-10 shadow-[0_30px_50px_-20px_rgba(0,0,0,.6)]">
              <Foto bestand="sapjes-en-inpaktafel.jpg" focus="88% 40%" sizes="(min-width: 768px) 26vw, 50vw" className="aspect-square" />
              <p className="absolute bottom-2 left-0 right-0 text-center font-hand text-xl text-ink">Met een strikje erom</p>
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-5 md:col-start-8 md:self-center">
          <Reveal>
            <p className="label text-honey-soft">{t.label}</p>
            <h2 id="cadeau-titel" className="display mt-5 text-[clamp(2.4rem,6.5vw,4.6rem)] leading-[1]">
              Iemand verrassen? <em className="text-honey-soft">Dat regelen we!</em>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-room/85">{t.tekst}</p>
          </Reveal>
          <ul className="mt-10 divide-y divide-room/15 border-y border-room/15">
            {t.mogelijkheden.map((m, i) => (
              <Reveal as="li" key={m.titel} delay={i * 0.06} className="flex gap-4 py-5">
                <Gift className="mt-1 h-5 w-5 shrink-0 text-honey-soft" aria-hidden />
                <div>
                  <h3 className="display text-xl">{m.titel}</h3>
                  <p className="mt-1 text-room/75">{m.tekst}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact#langskomen" className="btn btn-honey">{t.knop}</Link>
            {toonLink && (
              <Link href="/cadeaus" className="btn btn-ghost-light">Meer over cadeaus</Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
