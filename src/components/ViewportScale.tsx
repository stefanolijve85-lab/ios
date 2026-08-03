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
      const s = Math.min((w - PAD) / BASE_W, (h - PAD) / BASE_H);
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
