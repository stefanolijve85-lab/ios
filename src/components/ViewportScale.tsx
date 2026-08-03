'use client';
import { useEffect } from 'react';

// Desktop dynamic scaling. The game is authored for a fixed mobile canvas
// (BASE_W x BASE_H, mirrored in globals.css). On wide screens we scale that
// whole canvas uniformly with transform: scale() instead of letting the
// mobile-first layout reflow/stretch. This keeps the proportions pixel-perfect
// on ANY screen — the picture just gets bigger or smaller to fit.
//
// The scale factor can't be derived in pure CSS (scale() needs a unitless
// number, not a length), so we compute min(availW/BASE_W, availH/BASE_H) here
// and publish it as the --app-scale custom property the CSS reads.
const BASE_W = 430;
const BASE_H = 920;
const PAD = 24; // breathing room around the frame on desktop
const MIN_WIDE = 600; // below this we keep the fluid full-screen mobile layout
// Side ad rails (see AdRail.tsx / globals.css). When shown we reserve their
// width on both sides so the scaled canvas is centred BETWEEN the ads, never
// overlapping them. Keep ADS_FROM in sync with the .ad-rail media query.
const ADS_FROM = 1200;
const AD_W = 300;
const AD_EDGE = 28; // matches .ad-rail-left/right left/right
const AD_CANVAS_GAP = 28; // min gap between an ad and the canvas

export default function ViewportScale() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < MIN_WIDE) {
        // phones: no scaling — the CSS media query doesn't apply either
        root.style.setProperty('--app-scale', '1');
        return;
      }
      const reserved = w >= ADS_FROM ? 2 * (AD_W + AD_EDGE + AD_CANVAS_GAP) : 0;
      const s = Math.min((w - reserved - PAD) / BASE_W, (h - PAD) / BASE_H);
      // clamp so it never collapses to nothing on tiny/odd windows
      root.style.setProperty('--app-scale', String(Math.max(0.3, s)));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return null;
}
