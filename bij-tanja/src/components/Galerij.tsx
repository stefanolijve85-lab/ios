"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { fotos as alleFotos, type Foto } from "@/content/fotos";
import { Reveal } from "./Reveal";
import { teksten } from "@/content/teksten";

/** Masonry-galerij met lichtbak: tikken, swipen, pijltjestoetsen en Esc. */
export function Galerij({ fotos = alleFotos }: { fotos?: Foto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [richting, setRichting] = useState(0);
  const terug = useRef<HTMLElement | null>(null);
  const sluitKnop = useRef<HTMLButtonElement>(null);

  const ga = useCallback(
    (stap: number) => {
      setRichting(stap);
      setOpen((i) => (i === null ? i : (i + stap + fotos.length) % fotos.length));
    },
    [fotos.length]
  );
  const sluit = useCallback(() => {
    setOpen(null);
    requestAnimationFrame(() => terug.current?.focus());
  }, []);

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sluitKnop.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") sluit();
      if (e.key === "ArrowRight") ga(1);
      if (e.key === "ArrowLeft") ga(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, ga, sluit]);

  const huidig = open === null ? null : fotos[open];

  return (
    <>
      <ul className="columns-2 gap-3 sm:gap-4 lg:columns-3 [&>li]:mb-3 sm:[&>li]:mb-4">
        {fotos.map((f, i) => (
          <Reveal as="li" key={f.bestand} delay={(i % 3) * 0.06} className="break-inside-avoid">
            <button
              type="button"
              onClick={(e) => {
                terug.current = e.currentTarget;
                setRichting(0);
                setOpen(i);
              }}
              className="group relative block w-full overflow-hidden rounded-[2px] bg-room-deep text-left"
              aria-label={`Foto vergroten: ${f.bijschrift ?? f.alt}`}
            >
              <Image
                src={f.src}
                alt={f.alt}
                width={f.width}
                height={f.height}
                placeholder={f.blurDataURL ? "blur" : "empty"}
                blurDataURL={f.blurDataURL}
                sizes="(min-width: 1024px) 30vw, 48vw"
                className={`w-full object-cover transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.05] ${
                  i % 5 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"
                }`}
                style={{ objectPosition: f.focus }}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-room/85 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="h-4 w-4" aria-hidden />
              </span>
              {f.bijschrift && (
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 font-hand text-lg leading-tight text-room opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:text-xl">
                  {f.bijschrift}
                </span>
              )}
            </button>
          </Reveal>
        ))}
      </ul>

      <AnimatePresence>
        {huidig && open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Foto bekijken"
            className="fixed inset-0 z-[80] flex flex-col bg-[#14170e]/95 text-room backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.target === e.currentTarget && sluit()}
          >
            <div className="flex items-center justify-between px-4 pt-[max(.75rem,env(safe-area-inset-top))] sm:px-6">
              <p className="text-sm tabular-nums text-room/70" aria-live="polite">
                {open + 1} / {fotos.length}
              </p>
              <button
                ref={sluitKnop}
                type="button"
                onClick={sluit}
                className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10"
                aria-label="Sluiten"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-20" onClick={(e) => e.target === e.currentTarget && sluit()}>
              <AnimatePresence initial={false} custom={richting} mode="popLayout">
                <motion.div
                  key={huidig.bestand}
                  custom={richting}
                  initial={{ opacity: 0, x: richting * 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: richting * -80 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.8, 0.24, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60 || info.velocity.x < -400) ga(1);
                    else if (info.offset.x > 60 || info.velocity.x > 400) ga(-1);
                  }}
                  className="relative h-full max-h-[78svh] w-full max-w-6xl touch-pan-y"
                >
                  <Image
                    src={huidig.src}
                    alt={huidig.alt}
                    fill
                    sizes="100vw"
                    className="pointer-events-none select-none object-contain"
                    placeholder={huidig.blurDataURL ? "blur" : "empty"}
                    blurDataURL={huidig.blurDataURL}
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => ga(-1)}
                className="absolute left-2 top-1/2 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
                aria-label="Vorige foto"
              >
                <ChevronLeft className="h-7 w-7" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => ga(1)}
                className="absolute right-2 top-1/2 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
                aria-label="Volgende foto"
              >
                <ChevronRight className="h-7 w-7" aria-hidden />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:justify-center sm:px-6">
              <button type="button" onClick={() => ga(-1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 sm:hidden" aria-label="Vorige foto">
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
              <p className="flex-1 text-center font-hand text-2xl leading-tight text-honey-soft sm:flex-none">
                {huidig.bijschrift ?? "Bij Tanja"}
              </p>
              <button type="button" onClick={() => ga(1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 sm:hidden" aria-label="Volgende foto">
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function GalerijSectie() {
  return (
    <section id="rondkijken" aria-labelledby="galerij-titel" className="bg-room py-24 md:py-36">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <GalerijKop />
        <div className="mt-12 md:mt-16">
          <Galerij />
        </div>
      </div>
    </section>
  );
}

function GalerijKop() {
  const t = teksten.galerij;
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-end">
      <Reveal className="md:col-span-7">
        <p className="label text-bordeaux">{t.label}</p>
        <h2 id="galerij-titel" className="display mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1] text-olive-deep">
          {t.titel}
        </h2>
      </Reveal>
      <Reveal className="md:col-span-4 md:col-start-9" delay={0.08}>
        <p className="text-lg leading-relaxed text-ink-soft">{t.intro}</p>
      </Reveal>
    </div>
  );
}
