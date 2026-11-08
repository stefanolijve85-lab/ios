"use client";

import { useEffect, useRef, useState } from "react";

/** Tempo van het automatisch afspelen, in schermhoogtes per seconde (± 7 s per scène). */
const SPEED_VH_PER_S = 0.45;

/**
 * Knop in de menubalk: laat de intro (opening + beleving) vanzelf in een rustig,
 * gelijkmatig tempo doorlopen tot aan de behandelingen. Stopt zodra de bezoeker
 * zelf scrollt, veegt, een toets gebruikt of nogmaals op de knop tikt.
 */
export function AutoPlayButton() {
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const end = () => {
      const el = document.getElementById("behandelingen");
      return el ? el.getBoundingClientRect().top + window.scrollY : document.documentElement.scrollHeight;
    };
    // Al voorbij de intro? Dan opnieuw vanaf het begin.
    if (window.scrollY >= end() - 2) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    let pos = window.scrollY;
    const t0 = performance.now();
    let last = t0;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // na een haperend frame niet ineens springen
      last = now;
      const vh = window.innerHeight;
      const target = end();
      // Zacht op gang komen (1,5 s) en zacht uitlopen (laatste halve scherm): geen schok.
      const easeIn = Math.min(1, (now - t0) / 1500);
      const easeOut = Math.min(1, Math.max(0.15, (target - pos) / (0.5 * vh)));
      const k = Math.min(easeIn * easeIn * (3 - 2 * easeIn), easeOut);
      pos += SPEED_VH_PER_S * vh * dt * k;
      if (pos >= target) {
        window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
        setPlaying(false);
        return;
      }
      window.scrollTo({ top: pos, behavior: "instant" as ScrollBehavior });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);

    const stop = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-autoplay-toggle]")) return;
      setPlaying(false);
    };
    const keys = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape"].includes(e.key)) stop(e);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", keys);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", keys);
    };
  }, [playing]);

  return (
    <button
      type="button"
      className={`music-button play-button ${playing ? "is-on" : ""}`}
      aria-pressed={playing}
      aria-label={playing ? "Automatisch afspelen stoppen" : "Intro automatisch laten afspelen"}
      title={playing ? "Pauze" : "Afspelen"}
      data-autoplay-toggle
      onClick={() => setPlaying((p) => !p)}
    >
      <span className={playing ? "play-button__pause" : "play-button__play"} aria-hidden="true" />
    </button>
  );
}
