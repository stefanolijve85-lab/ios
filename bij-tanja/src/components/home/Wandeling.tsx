"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Foto } from "../Foto";
import { teksten } from "@/content/teksten";

type Stap = (typeof teksten.wandeling)[number];

/**
 * Scène 2 — "Kom verder!"
 * Tijdens het scrollen loop je als het ware de winkel in: de foto opent zich
 * als een deur en de beelden lopen zacht in elkaar over.
 */
export function Wandeling() {
  const ref = useRef<HTMLElement>(null);
  const rustig = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const stappen = teksten.wandeling;

  // "Deuropening": de foto groeit van een kader naar volledig beeld
  const inset = useTransform(scrollYProgress, [0, 0.18], rustig ? ["0%", "0%"] : ["9%", "0%"]);
  const radius = useTransform(scrollYProgress, [0, 0.18], rustig ? ["0px", "0px"] : ["28px", "0px"]);
  const clipPath = useTransform([inset, radius] as MotionValue[], ([i, r]) => `inset(${i} ${i} ${i} ${i} round ${r})`);

  return (
    <section
      id="binnen"
      ref={ref}
      aria-label="Een wandeling door de winkel"
      className="relative bg-room"
      style={{ height: `${stappen.length * 110 + 40}svh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ clipPath }} className="absolute inset-0 bg-olive-deep">
          {stappen.map((s, i) => (
            <Laag key={s.foto} stap={s} i={i} n={stappen.length} p={scrollYProgress} rustig={!!rustig} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d2214]/85 via-[#1d2214]/10 to-[#1d2214]/30" />
        </motion.div>

        <div className="relative mx-auto flex h-full max-w-page items-end px-6 pb-[14svh] sm:px-10 lg:px-16">
          {stappen.map((s, i) => (
            <Zin key={s.tekst} tekst={s.tekst} i={i} n={stappen.length} p={scrollYProgress} />
          ))}
        </div>

        <ol aria-hidden className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-3 sm:right-8">
          {stappen.map((s, i) => (
            <Stip key={s.foto} i={i} n={stappen.length} p={scrollYProgress} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function bereik(i: number, n: number) {
  const begin = 0.12 + (i / n) * 0.82;
  const eind = 0.12 + ((i + 1) / n) * 0.82;
  return [begin, eind] as const;
}

function Laag({ stap, i, n, p, rustig }: { stap: Stap; i: number; n: number; p: MotionValue<number>; rustig: boolean }) {
  const [b, e] = bereik(i, n);
  const opacity = useTransform(p, i === 0 ? [0, 1] : [b - 0.07, b + 0.02], i === 0 ? [1, 1] : [0, 1]);
  const scale = useTransform(p, [Math.max(0, b - 0.1), e], rustig ? [1, 1] : [1.14, 1.0]);
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Foto bestand={stap.foto} focus={stap.focus} sizes="100vw" className="h-full w-full" />
      </motion.div>
    </motion.div>
  );
}

function Zin({ tekst, i, n, p }: { tekst: string; i: number; n: number; p: MotionValue<number> }) {
  const [b, e] = bereik(i, n);
  const laatste = i === n - 1;
  const opacity = useTransform(p, [b - 0.02, b + 0.06, e - 0.08, e], [0, 1, 1, laatste ? 1 : 0]);
  const y = useTransform(p, [b - 0.02, b + 0.06, e - 0.08, e], [40, 0, 0, laatste ? 0 : -30]);
  return (
    <motion.p
      style={{ opacity, y }}
      className="display absolute bottom-[14svh] left-6 right-14 max-w-[18ch] text-[clamp(2.3rem,8vw,5.6rem)] leading-[1.02] text-room sm:left-10 lg:left-16"
    >
      {tekst}
    </motion.p>
  );
}

function Stip({ i, n, p }: { i: number; n: number; p: MotionValue<number> }) {
  const [b, e] = bereik(i, n);
  const h = useTransform(p, [b - 0.04, b + 0.04, e - 0.04, e + 0.02], [8, 28, 28, 8]);
  const o = useTransform(p, [b - 0.04, b + 0.04, e - 0.04, e + 0.02], [0.4, 1, 1, 0.4]);
  return <motion.li style={{ height: h, opacity: o }} className="w-[3px] rounded-full bg-honey" />;
}
