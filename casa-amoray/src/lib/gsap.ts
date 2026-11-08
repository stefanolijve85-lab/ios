"use client";

/**
 * Laadt GSAP + ScrollTrigger pas in de browser, en maar één keer.
 * Bij `prefers-reduced-motion: reduce` wordt GSAP helemaal niet geladen.
 */
type GsapBundle = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

let bundle: Promise<GsapBundle> | null = null;

export function loadGsap(): Promise<GsapBundle> {
  if (!bundle) {
    bundle = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, st]) => {
      const gsap = g.gsap;
      const ScrollTrigger = st.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      // Mobiele browsers: niet herberekenen als de adresbalk in-/uitschuift.
      ScrollTrigger.config({ ignoreMobileResize: true });
      return { gsap, ScrollTrigger };
    });
  }
  return bundle;
}

export function motionAllowed() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
