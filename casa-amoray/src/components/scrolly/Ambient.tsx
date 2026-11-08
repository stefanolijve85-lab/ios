"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Laat elementen met `.reveal` rustig in beeld komen (één keer).
 * Vertraging per element via de CSS-variabele `--i`.
 * Bij verminderde beweging regelt de CSS dat alles direct zichtbaar is.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/** Dunne voortgangslijn tijdens de beleving: hoever ben je in het bezoek? */
export function JourneyProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const journey = document.querySelector<HTMLElement>(".journey");
    if (!journey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = journey.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      setVisible(r.top < window.innerHeight * 0.2 && r.bottom > window.innerHeight * 0.8);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className={`journey-progress ${visible ? "is-visible" : ""}`} aria-hidden="true">
      <div ref={bar} className="journey-progress__bar" />
    </div>
  );
}
