"use client";

import { useEffect, useRef } from "react";
import { frameUrl, sequences, type Scene } from "@/content/scenes";
import { FrameSequence } from "@/lib/FrameSequence";
import { loadGsap, motionAllowed } from "@/lib/gsap";
import { Placeholder } from "@/components/Placeholder";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Eén scène van de filmische klantreis.
 *
 * Zonder JavaScript of bij `prefers-reduced-motion` is dit een gewone,
 * statische sectie met beeld en tekst. Met beweging wordt de sectie
 * meerdere schermhoogtes lang en blijft het 'podium' (CSS sticky) staan,
 * terwijl ScrollTrigger de voortgang 0..1 doorgeeft aan beeld en tekst.
 * Omhoog scrollen speelt alles vanzelf terug.
 */
export function SceneStage({ scene, index }: { scene: Scene; index: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  const seqEntry = scene.media.kind === "sequence" ? sequences[scene.media.id] : undefined;
  const poster =
    scene.media.kind === "sequence" && seqEntry
      ? {
          mobile: frameUrl((seqEntry.mobile ?? seqEntry.desktop)!, 0),
          desktop: frameUrl((seqEntry.desktop ?? seqEntry.mobile)!, 0),
        }
      : scene.media.kind === "still"
        ? { mobile: scene.media.mobile, desktop: scene.media.desktop }
        : null;

  useEffect(() => {
    if (!motionAllowed()) return;
    const section = sectionRef.current!;
    let cancelled = false;
    let seq: FrameSequence | null = null;
    let revert: (() => void) | null = null;
    const observers: IntersectionObserver[] = [];

    if (seqEntry && canvasRef.current) {
      const canvas = canvasRef.current;
      seq = new FrameSequence(canvas, seqEntry, () => canvas.classList.add("is-ready"));
      // Laad als de scène binnen ~1,5 scherm komt; ruim op als hij ver weg is.
      // Wacht tot de pagina zelf geladen is, zodat de hero (LCP) voorrang krijgt.
      let pageReady = document.readyState === "complete";
      let wanted = false;
      const startLoad = () => pageReady && wanted && seq?.load();
      if (!pageReady)
        window.addEventListener(
          "load",
          () => {
            pageReady = true;
            const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
            idle ? idle(startLoad) : setTimeout(startLoad, 200);
          },
          { once: true },
        );
      const near = new IntersectionObserver(
        (e) => {
          wanted = e[0].isIntersecting;
          startLoad();
        },
        { rootMargin: "150% 0px" },
      );
      const far = new IntersectionObserver((e) => !e[0].isIntersecting && seq?.unload(), {
        rootMargin: "500% 0px",
      });
      near.observe(section);
      far.observe(section);
      observers.push(near, far);
    }

    const media = scene.media;
    const apply = (p: number) => {
      seq?.setProgress(p);
      const pic = pictureRef.current;
      if (pic && media.kind === "still") {
        // Tijdelijke 'camerabeweging' over een still.
        const e = smooth(0, 1, p);
        let t = "";
        if (media.motion === "push") t = `scale(${1 + 0.22 * e})`;
        if (media.motion === "drift") t = `scale(1.12) translate3d(${(0.5 - e) * 5}%, 0, 0)`;
        if (media.motion === "settle") t = `scale(${1.16 - 0.16 * e})`;
        pic.style.transform = t;
      }
      // Zachte 'dip' aan het eind van de scène: filmische overgang.
      if (shadeRef.current) shadeRef.current.style.opacity = String(0.55 * smooth(0.82, 1, p));
    };

    const onResize = () => {
      if (!seq) return;
      if (seq.pickVariant()) {
        canvasRef.current?.classList.remove("is-ready");
        seq.load();
      }
      seq.resize();
    };
    window.addEventListener("resize", onResize);

    loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: () => apply(state.p),
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.4 },
        });
        const cap = captionRef.current;
        if (cap) {
          gsap
            .timeline({
              scrollTrigger: { trigger: section, start: "top 55%", end: "bottom bottom", scrub: 0.4 },
            })
            .fromTo(cap, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" })
            .to(cap, { opacity: 1, duration: 0.5 })
            .to(cap, { opacity: 0, y: -18, duration: 0.2, ease: "power1.in" });
        }
      }, section);
      revert = () => ctx.revert();
      apply(0);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      observers.forEach((o) => o.disconnect());
      revert?.();
      seq?.destroy();
    };
  }, [scene, seqEntry]);

  const focus = scene.media.kind === "still" && scene.media.focus;
  const headingId = `${scene.id}-titel`;

  return (
    <section
      ref={sectionRef}
      id={scene.id}
      className="scene"
      style={{ "--len": scene.length } as React.CSSProperties}
      aria-labelledby={headingId}
    >
      <div className="scene__stage">
        <div className="scene__media">
          {poster && (
            <div
              ref={pictureRef}
              className="scene__picture"
              style={focus ? { transformOrigin: `${focus[0]}% ${focus[1]}%` } : undefined}
            >
              <picture>
                <source media="(min-aspect-ratio: 1/1)" srcSet={poster.desktop} />
                <img src={poster.mobile} alt={scene.alt} loading="lazy" decoding="async" />
              </picture>
            </div>
          )}
          {seqEntry && <canvas ref={canvasRef} className="scene__canvas" aria-hidden="true" />}
          <div ref={shadeRef} className="scene__shade" aria-hidden="true" />
        </div>

        <div ref={captionRef} className="scene__caption">
          <p className="eyebrow">
            <span aria-hidden="true">{String(index + 2).padStart(2, "0")} · </span>
            {scene.label}
          </p>
          <h3 id={headingId} className="scene__heading">
            {scene.heading}
          </h3>
          {scene.body && <p className="scene__body">{scene.body}</p>}
          {scene.link && (
            <a className="text-link text-link--light" href={scene.link.href}>
              {scene.link.label}
            </a>
          )}
        </div>

        {scene.placeholder && <Placeholder className="scene__placeholder">{scene.placeholder}</Placeholder>}
      </div>
    </section>
  );
}
