import Link from "@/components/Lnk";
import { Heart } from "lucide-react";
import { Foto } from "../Foto";
import { Reveal } from "../Reveal";
import { teksten } from "@/content/teksten";

/** Scène 7 — even kennismaken met Tanja */
export function MaakKennis({ toonLink = true }: { toonLink?: boolean }) {
  const t = teksten.tanja;
  return (
    <section id="tanja" aria-labelledby="tanja-titel" className="grain relative bg-room-paper py-24 md:py-36">
      <div className="relative mx-auto grid max-w-page items-center gap-14 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="relative md:col-span-5 md:col-start-2">
          <Reveal>
            <Foto
              bestand="tanja-in-de-deur.jpg"
              sizes="(min-width: 768px) 40vw, 100vw"
              className="aspect-[4/5] rounded-t-[999px] rounded-b-[2px]"
            />
          </Reveal>
          <Reveal delay={0.2} className="absolute -bottom-8 -left-2 sm:-left-8">
            <p className="-rotate-6 font-script text-[3.4rem] leading-none text-bordeaux drop-shadow-[0_2px_0_#FBF7F0]">Tanja</p>
          </Reveal>
        </div>
        <div className="md:col-span-5 md:col-start-8">
          <Reveal>
            <p className="label text-bordeaux">{t.label}</p>
            <h2 id="tanja-titel" className="display mt-5 text-[clamp(2.4rem,6vw,4.4rem)] leading-[1] text-olive-deep">
              Hoi! Wat leuk dat je <em className="text-bordeaux">er bent.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            {t.tekst.map((p) => (
              <p key={p} className="mt-6 text-lg leading-relaxed text-ink md:text-xl">{p}</p>
            ))}
          </Reveal>
          <Reveal delay={0.14}>
            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4">
              {t.beloftes.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-ink-soft">
                  <Heart className="mt-1 h-4 w-4 shrink-0 fill-bordeaux/15 text-bordeaux" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            {toonLink && (
              <Link href="/over-tanja" className="btn btn-ghost-dark mt-10">Meer over Tanja</Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
