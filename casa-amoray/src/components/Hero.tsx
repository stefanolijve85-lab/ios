"use client";

import { useEffect, useRef } from "react";
import { heroAlt, heroMedia } from "@/content/scenes";
import { bookingHref, business } from "@/content/site";
import { loadGsap, motionAllowed } from "@/lib/gsap";
import { Placeholder } from "@/components/Placeholder";

/** Scène 1 — De uitnodiging. Alle kerninformatie en de boekknop direct in beeld. */
export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    let revert: (() => void) | null = null;
    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !ref.current) return;
      const ctx = gsap.context(() => {
        // Rustige binnenkomst bij openen
        gsap.from(".hero__reveal", { opacity: 0, y: 18, duration: 1.1, ease: "power2.out", stagger: 0.12, delay: 0.1 });
        gsap.fromTo(".hero__picture", { scale: 1.08 }, { scale: 1, duration: 2.4, ease: "power2.out" });
        // Bij scrollen: de tekst trekt zich terug en het beeld komt vrij.
        // Het podium blijft staan; daarna vloeit 'Binnenkomst' (zelfde beeld) eroverheen.
        const firstScreen = () => `+=${window.innerHeight * 0.45}`;
        gsap.to(".hero__content", {
          opacity: 0,
          y: -48,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: firstScreen, scrub: 0.4, invalidateOnRefresh: true },
        });
        gsap.to(".hero__shade, .hero__scroll", {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: firstScreen, scrub: 0.4, invalidateOnRefresh: true },
        });
      }, ref);
      revert = () => ctx.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  if (heroMedia.kind !== "still") return null;

  return (
    <section ref={ref} className="hero" id="top" aria-labelledby="hero-titel">
      <div className="hero__stage">
        <div className="hero__media">
          <div className="hero__picture">
            <picture>
              <source media="(min-aspect-ratio: 1/1)" srcSet={heroMedia.desktop} />
              <img src={heroMedia.mobile} alt={heroAlt} fetchPriority="high" decoding="async" />
            </picture>
          </div>
          <div className="hero__shade" aria-hidden="true" />
        </div>

        <div className="hero__content">
          <p className="eyebrow eyebrow--light hero__reveal">Massage voor vrouwen in {business.city}</p>
          <h1 id="hero-titel" className="hero__title hero__reveal">
            {business.slogan}
          </h1>
          <p className="hero__lead hero__reveal">Ontspanning en persoonlijke aandacht bij {business.name}.</p>
          <p className="hero__meta hero__reveal">
            Postpartummassage &amp; ontspanningsmassage
            <span aria-hidden="true"> · </span>
            <br className="only-mobile" />
            {business.tagline.toLowerCase()}
          </p>
          <div className="hero__actions hero__reveal">
            <a className="btn btn--light" href={bookingHref}>
              Boek jouw moment
            </a>
            <a className="text-link text-link--light" href="#behandelingen">
              Bekijk behandelingen
            </a>
          </div>
          <Placeholder className="hero__placeholder">Mock-up van de salon, wordt Higgsfield-clip 01.</Placeholder>
        </div>

        <a className="hero__scroll" href="#beleving" aria-label="Scroll naar de beleving">
          <span aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
