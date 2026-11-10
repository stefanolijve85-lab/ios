"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { teksten } from "@/content/teksten";

/** Kleine, vriendelijke begroeting — één keer per bezoek, verdwijnt vanzelf. */
export function Greeting() {
  const [toon, setToon] = useState(false);
  const [groet, setGroet] = useState("");

  useEffect(() => {
    let gezien = false;
    try {
      gezien = sessionStorage.getItem("bt-groet") === "1";
      sessionStorage.setItem("bt-groet", "1");
    } catch {}
    if (gezien) return;
    const u = new Date().getHours();
    const g = teksten.begroeting;
    setGroet(u < 6 ? g.nacht : u < 12 ? g.ochtend : u < 18 ? g.middag : g.avond);
    const a = setTimeout(() => setToon(true), 1400);
    const b = setTimeout(() => setToon(false), 8400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 flex justify-center sm:left-auto sm:right-6 sm:justify-end">
      <AnimatePresence>
        {toon && (
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.6, ease: [0.22, 0.8, 0.24, 1] }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-room-paper py-3 pl-4 pr-2 text-ink shadow-[0_18px_40px_-18px_rgba(42,36,29,.55)] ring-1 ring-ink/10"
          >
            <span className="text-2xl" aria-hidden>👋</span>
            <p className="leading-tight">
              <span className="font-hand text-[1.45rem] text-bordeaux">{groet}</span>{" "}
              <span className="text-sm text-ink-soft">{teksten.begroeting.zin}</span>
            </p>
            <button
              type="button"
              onClick={() => setToon(false)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
              aria-label="Begroeting sluiten"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
