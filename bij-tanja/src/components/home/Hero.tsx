"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, MapPin } from "lucide-react";
import { Foto } from "../Foto";
import { teksten } from "@/content/teksten";
import { fotos } from "@/content/fotos";

const ease = [0.22, 0.8, 0.24, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const rustig = useReducedMotion();
  const scale = useTransform(scrollYProgress, [0, 1], rustig ? [1, 1] : [1.04, 1.22]);
  const tekstY = useTransform(scrollYProgress, [0, 1], rustig ? [0, 0] : [0, -90]);
  const vervaag = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroFoto = fotos.find((f) => f.hero) ?? fotos[0];
  const t = teksten.hero;

  return (
    <section ref={ref} aria-labelledby="hero-titel" className="relative h-[100svh] min-h-[38rem] overflow-hidden bg-olive-deep">
      <motion.div style={{ scale }} className="absolute inset-0 origin-[65%_60%]">
        <Foto bestand={heroFoto.bestand} sizes="100vw" priority className="h-full w-full" />
      </motion.div>
      {/* Warme kleurlaag zodat tekst goed leesbaar is */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d2214] via-[#1d2214]/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1d2214]/70 via-transparent to-transparent md:from-[#1d2214]/60" />

      <motion.div
        style={{ y: tekstY, opacity: vervaag }}
        className="relative mx-auto flex h-full max-w-page flex-col justify-end px-4 pb-24 sm:px-6 md:pb-28 lg:px-10"
      >
        <motion.p
          initial={{ opacity: 0, y: 16, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 0.9, delay: 0.25, ease }}
          className="origin-left font-hand text-[1.75rem] leading-none text-honey-soft md:text-4xl"
        >
          {t.groet}
        </motion.p>
        <h1 id="hero-titel" className="display mt-3 max-w-[12ch] text-[clamp(3.1rem,13vw,8.5rem)] leading-[0.92] text-room">
          <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4, ease }}>
            Welkom
          </motion.span>
          <motion.span
            className="block italic text-honey-soft"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease }}
          >
            Bij Tanja
          </motion.span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease }}
          className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-room/90 md:text-lg"
        >
          {t.sub}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.95, ease }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <a href="#binnen" className="btn btn-honey">
            {t.knopKijken} <ArrowDown className="h-4 w-4" aria-hidden />
          </a>
          <Link href="/contact#langskomen" className="btn btn-ghost-light">
            <MapPin className="h-4 w-4" aria-hidden /> {t.knopLangs}
          </Link>
        </motion.div>
      </motion.div>

      <motion.a
        href="#binnen"
        style={{ opacity: vervaag }}
        className="absolute bottom-6 right-4 hidden flex-col items-center gap-3 text-room/80 sm:flex sm:right-6 lg:right-10"
        aria-label="Scroll verder de winkel in"
      >
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] [writing-mode:vertical-rl]">{t.scroll}</span>
        <span className="relative block h-14 w-px overflow-hidden bg-room/25">
          <span className="drip absolute inset-x-0 top-0 h-1/2 bg-honey" />
        </span>
      </motion.a>
    </section>
  );
}
