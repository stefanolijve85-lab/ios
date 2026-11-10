"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Foto } from "../Foto";
import { Reveal } from "../Reveal";
import { borrel, borrelZinnen, type Keuze } from "@/content/borrel";
import { teksten } from "@/content/teksten";

type Soort = keyof typeof borrel;
const soorten: { key: Soort; titel: string }[] = [
  { key: "kaas", titel: "Welke kaas?" },
  { key: "drank", titel: "Iets te drinken?" },
  { key: "knabbel", titel: "En om te knabbelen?" },
];

const willekeurig = <T,>(lijst: readonly T[], niet?: T) => {
  const opties = lijst.length > 1 && niet ? lijst.filter((x) => x !== niet) : lijst;
  return opties[Math.floor(Math.random() * opties.length)];
};

/** Scène 5 — tijd voor de borrel, met een speelse borrelplank-bedenker */
export function Borrel() {
  const t = teksten.borrel;
  const [keuze, setKeuze] = useState<Record<Soort, Keuze>>({
    kaas: borrel.kaas[1],
    drank: borrel.drank[0],
    knabbel: borrel.knabbel[0],
  });
  const [zinNr, setZinNr] = useState(0);

  const verras = () => {
    setKeuze((k) => ({
      kaas: willekeurig(borrel.kaas, k.kaas),
      drank: willekeurig(borrel.drank, k.drank),
      knabbel: willekeurig(borrel.knabbel, k.knabbel),
    }));
    setZinNr((n) => (n + 1) % borrelZinnen.length);
  };

  const zin = borrelZinnen[zinNr](keuze.kaas.zin, keuze.drank.zin, keuze.knabbel.zin);

  return (
    <section id="borrel" aria-labelledby="borrel-titel" className="grain relative overflow-hidden bg-olive-deep py-24 text-room md:py-36">
      <div className="relative mx-auto grid max-w-page gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-10">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="label text-honey">{t.label}</p>
            <h2 id="borrel-titel" className="display mt-5 text-[clamp(2.4rem,6.5vw,4.8rem)] leading-[1] text-room">
              Van een gewone avond maak je iets <em className="text-honey-soft">bijzonders.</em>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-room/80">{t.tekst}</p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 space-y-6">
            {soorten.map((s) => (
              <fieldset key={s.key}>
                <legend className="font-hand text-2xl text-honey-soft">{s.titel}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {borrel[s.key].map((o: Keuze) => {
                    const aan = keuze[s.key].id === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={aan}
                        onClick={() => setKeuze((k) => ({ ...k, [s.key]: o }))}
                        className={`min-h-[2.75rem] rounded-full px-4 text-sm font-medium transition-all duration-300 ease-soft ${
                          aan ? "bg-honey text-ink" : "bg-room/[.06] text-room/85 ring-1 ring-inset ring-room/20 hover:bg-room/10"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </Reveal>
        </div>

        {/* De borrelplank */}
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7 lg:self-center">
          <div
            className="relative rounded-[2.2rem] p-5 shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)] sm:p-8"
            style={{
              background:
                "repeating-linear-gradient(92deg, rgba(0,0,0,.05) 0 2px, transparent 2px 22px), radial-gradient(120% 90% at 30% 20%, #c8925f 0%, #a5673a 55%, #7f4c29 100%)",
            }}
          >
            <span aria-hidden className="absolute -right-3 top-1/2 h-14 w-7 -translate-y-1/2 rounded-r-full bg-[#7f4c29]" />
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {soorten.map((s, i) => (
                <div key={s.key} className={`${i === 1 ? "mt-8" : ""}`}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={keuze[s.key].id}
                      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      className="aspect-square overflow-hidden rounded-full ring-4 ring-room/70 shadow-[0_14px_30px_-12px_rgba(0,0,0,.7)]"
                    >
                      <Foto
                        bestand={keuze[s.key].foto}
                        alt=""
                        focus={keuze[s.key].focus}
                        sizes="(min-width: 1024px) 14vw, 30vw"
                        className="h-full w-full"
                        zoom={keuze[s.key].zoom}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <p className="mt-3 text-center font-hand text-xl text-room">{keuze[s.key].label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-[#1f1f1c] p-5 ring-1 ring-white/10 sm:p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={zin}
                  aria-live="polite"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="font-hand text-[1.7rem] leading-snug text-room"
                >
                  {zin}
                </motion.p>
              </AnimatePresence>
            </div>
            <button type="button" onClick={verras} className="btn btn-honey mt-6 w-full sm:w-auto">
              <Shuffle className="h-4 w-4" aria-hidden /> {t.knop}
            </button>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-room/60">{t.disclaimer}</p>
        </Reveal>
      </div>
    </section>
  );
}
