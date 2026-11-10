"use client";
import Link from "@/components/Lnk";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Foto } from "../Foto";
import { Reveal } from "../Reveal";
import { Krijtbordje } from "../Krijtbordje";
import { teksten } from "@/content/teksten";

/** Scène 4 — de kaasbeleving */
export function KaasBeleving() {
  const ref = useRef<HTMLDivElement>(null);
  const rustig = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], rustig ? [1, 1] : [0.84, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], rustig ? [4, 4] : [40, 4]);
  const binnenScale = useTransform(scrollYProgress, [0, 1], rustig ? [1, 1] : [1.18, 1]);
  const t = teksten.kaas;

  return (
    <section aria-labelledby="kaas-titel" className="relative overflow-hidden bg-room-deep py-24 md:py-36">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <Reveal>
          <p className="label text-bordeaux">{t.label}</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 id="kaas-titel" className="display mt-5 max-w-[16ch] text-[clamp(2.5rem,7.5vw,6rem)] leading-[0.98] text-olive-deep">
            Zeg nou zelf… van kaas word je toch <em className="text-bordeaux">blij?</em>
          </h2>
        </Reveal>
      </div>

      <div ref={ref} className="mx-auto mt-12 max-w-[96rem] px-2 sm:px-4 md:mt-16">
        <motion.div style={{ scale, borderRadius: radius }} className="relative overflow-hidden will-change-transform">
          <motion.div style={{ scale: binnenScale }} className="origin-center">
            <Foto
              bestand="kaastoonbank-weegschaal.jpg"
              sizes="100vw"
              className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/8]"
            />
          </motion.div>
          <Krijtbordje className="absolute bottom-5 left-5 -rotate-2 text-2xl md:bottom-10 md:left-10 md:text-3xl">
            {t.notitie}
          </Krijtbordje>
        </motion.div>
      </div>

      <div className="mx-auto mt-14 grid max-w-page gap-10 px-4 sm:px-6 md:mt-20 md:grid-cols-12 lg:px-10">
        <Reveal className="md:col-span-5">
          <p className="text-xl leading-relaxed text-ink md:text-[1.35rem]">{t.tekst}</p>
          <Link href="/assortiment#kaas" className="btn btn-olive mt-8">
            Bekijk de kazen <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
        {/* Details: uitsneden van echte winkelfoto's */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:col-span-6 md:col-start-7">
          <Reveal className="mt-10">
            <figure>
              <Foto
                bestand="kaaswand.jpg"
                alt="Detail van de kaaswand met aangesneden kazen"
                focus="60% 58%"
                sizes="(min-width: 768px) 24vw, 50vw"
                className="aspect-[3/4] rounded-[2px]"
                zoom={1.9}
              />
              <figcaption className="mt-3 font-hand text-xl text-wood">Met komijn, of juist pittig?</figcaption>
            </figure>
          </Reveal>
          <Reveal delay={0.12}>
            <figure>
              <Foto
                bestand="kaastoonbank-weegschaal.jpg"
                alt="Detail van grote kaaswielen op de toonbank"
                focus="66% 42%"
                sizes="(min-width: 768px) 24vw, 50vw"
                className="aspect-[3/4] rounded-[2px]"
                zoom={1.9}
              />
              <figcaption className="mt-3 font-hand text-xl text-wood">Hele wielen, vers aangesneden</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
