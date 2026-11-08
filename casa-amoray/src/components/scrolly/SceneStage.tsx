"use client";

import { useEffect, useRef } from "react";
import { frameUrl, OVERLAP, sequences, type Scene } from "@/content/scenes";
import { cameraTransform } from "@/lib/camera";
import { FrameSequence } from "@/lib/FrameSequence";
import { loadGsap, motionAllowed } from "@/lib/gsap";
import { Placeholder } from "@/components/Placeholder";
import { SplitWords } from "./SplitWords";

/**
 * Eén scène van de filmische klantreis.
 *
 * Zonder JavaScript of bij `prefers-reduced-motion` is dit een gewone,
 * statische sectie met beeld en tekst.
 *
 * Met beweging:
 *  - is de sectie `length` schermhoogtes lang en blijft het podium staan (CSS sticky);
 *  - overlapt hij de vorige scène met OVERLAP schermhoogte: daar vloeit hij erover heen;
 *  - stuurt de scrollvoortgang 0..1 het beeld (beeldreeks of camerapad) en de tekst.
 * Omhoog scrollen speelt alles vanzelf terug.
 */
export function SceneStage({ scene, index, isLast = false }: { scene: Scene; index: number; isLast?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

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
    const stage = stageRef.current!;
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
        const t = cameraTransform(media.camera, p);
        if (t) pic.style.transform = t;
      }
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
      const span = Math.max(0.5, scene.length - 1); // scrollafstand waarin het podium vaststaat
      const fIn = OVERLAP / span; // deel van de scène waarin hij over de vorige heen vloeit
      const fOut = OVERLAP / span; // deel waarin de volgende eroverheen vloeit

      const ctx = gsap.context(() => {
        // 1. Overgang: deze scène vloeit over de vorige heen (beide staan stil).
        gsap.fromTo(
          stage,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * OVERLAP}`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        // 2. Camera: beeldreeks of camerapad.
        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: () => apply(state.p),
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 },
        });

        // 3. Tekst: eerst het hoofdstuk, dan woord voor woord de kop, dan de rest.
        const cap = captionRef.current;
        if (cap) {
          const inAt = fIn * 0.8; // tekst pas als het beeld grotendeels zichtbaar is
          const tl = gsap.timeline({
            scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 },
          });
          tl.set({}, {}, 1); // tijdlijn = precies 0..1 van de scène
          tl.fromTo(".eyebrow", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, inAt);
          tl.fromTo(
            ".word",
            { opacity: 0, y: "0.4em" },
            { opacity: 1, y: 0, duration: 0.12, stagger: 0.018, ease: "power2.out" },
            inAt + 0.04,
          );
          tl.fromTo(
            ".scene__after",
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.12, stagger: 0.04, ease: "power2.out" },
            inAt + 0.16,
          );
          // De laatste scène wordt bedekt door de behandelingen; daar blijft de tekst staan.
          // Tekst is weg vóórdat de volgende scène begint over te vloeien (geen dubbele tekst).
          if (!isLast)
            tl.to(cap, { opacity: 0, y: -22, duration: 0.09, ease: "power1.in" }, Math.max(inAt + 0.3, 1 - fOut - 0.17));
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
  }, [scene, seqEntry, isLast]);

  const origin = scene.media.kind === "still" && scene.media.origin;
  const headingId = `${scene.id}-titel`;

  return (
    <section
      ref={sectionRef}
      id={scene.id}
      className={`scene ${isLast ? "scene--last" : ""}`}
      style={{ "--len": scene.length } as React.CSSProperties}
      aria-labelledby={headingId}
    >
      <div ref={stageRef} className="scene__stage">
        <div className="scene__media">
          {poster && (
            <div
              ref={pictureRef}
              className="scene__picture"
              style={origin ? { transformOrigin: `${origin[0]}% ${origin[1]}%` } : undefined}
            >
              <picture>
                <source media="(min-aspect-ratio: 1/1)" srcSet={poster.desktop} />
                <img src={poster.mobile} alt={scene.alt} loading="lazy" decoding="async" />
              </picture>
            </div>
          )}
          {seqEntry && <canvas ref={canvasRef} className="scene__canvas" aria-hidden="true" />}
        </div>

        <div ref={captionRef} className="scene__caption">
          <p className="eyebrow">
            <span aria-hidden="true">{String(index + 2).padStart(2, "0")} · </span>
            {scene.label}
          </p>
          <h3 id={headingId} className="scene__heading">
            <SplitWords text={scene.heading} />
          </h3>
          {scene.body && <p className="scene__body scene__after">{scene.body}</p>}
          {scene.link && (
            <a className="text-link text-link--light scene__after" href={scene.link.href}>
              {scene.link.label}
            </a>
          )}
        </div>

        {scene.placeholder && <Placeholder className="scene__placeholder">{scene.placeholder}</Placeholder>}
      </div>
    </section>
  );
}
