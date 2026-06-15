'use client';
import { useEffect, useRef } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';

type Particle = {
  x: number; y: number; r: number; vx: number; vy: number; a: number; life: number;
  len: number; w: number; ang: number; rad: number; spd: number;
};

// Lightweight ambient motion over the scene. Themed kinds:
//   bubbles / embers / steam → rise upward (intensity scales with the multiplier)
//   speed                    → perspective "warp" streaks racing out from the
//                              vanishing point toward the viewer (with the train),
//                              faster + denser as the multiplier climbs
// Shared engine feature; a theme opts in via ui.motion. Single canvas, pooled
// particles, capped count — cheap on mobile.
export default function SceneMotion() {
  const { liveMultiplier, stateRef } = useGame();
  const theme = useTheme();
  const motion = theme.ui?.motion;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!motion) return;
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    const { kind, color } = motion;
    const hex = color.replace('#', '');
    const cr = parseInt(hex.slice(0, 2), 16) || 255;
    const cg = parseInt(hex.slice(2, 4), 16) || 255;
    const cb = parseInt(hex.slice(4, 6), 16) || 255;
    const rgba = (a: number) => `rgba(${cr},${cg},${cb},${a})`;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const resize = () => {
      W = parent.clientWidth; H = parent.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const blank = (): Particle => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, a: 0, life: 0, len: 0, w: 0, ang: 0, rad: 0, spd: 0 });
    const spawn = () => {
      if (kind === 'speed') {
        const maxR = Math.hypot(W, H) * 0.72;
        parts.push({ ...blank(), ang: Math.random() * Math.PI * 2, rad: maxR * (0.5 + Math.random() * 0.5), spd: 2.0 + Math.random() * 1.8, a: 0.12 + Math.random() * 0.3, w: 1 + Math.random() * 2.2 });
      } else if (kind === 'steam') {
        parts.push({ ...blank(), x: Math.random() * W, y: H + 12, r: 6 + Math.random() * 12, vx: (Math.random() - 0.5) * 0.2, vy: -(0.2 + Math.random() * 0.5), a: 0.05 + Math.random() * 0.07 });
      } else if (kind === 'embers') {
        parts.push({ ...blank(), x: Math.random() * W, y: H + 8, r: 1 + Math.random() * 2, vx: (Math.random() - 0.5) * 0.35, vy: -(0.4 + Math.random() * 1.0), a: 0.55 + Math.random() * 0.4 });
      } else { // bubbles
        parts.push({ ...blank(), x: Math.random() * W, y: H + 8, r: 1.5 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.2, vy: -(0.3 + Math.random() * 0.8), a: 0.4 + Math.random() * 0.4 });
      }
    };

    const parts: Particle[] = [];
    let raf = 0, acc = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(50, t - last); last = t;
      const running = stateRef.current?.phase === 'running';
      const m = running ? liveMultiplier() : 1;
      const intensity = running ? Math.min(1, 0.3 + (m - 1) * 0.06) : 0.18;
      const rate = kind === 'steam' ? 0.04 : kind === 'speed' ? 0.22 : 0.13;
      acc += dt * intensity * rate;
      while (acc > 1) { if (parts.length < 90) spawn(); acc -= 1; }

      ctx.clearRect(0, 0, W, H);
      const speed = 0.6 + intensity * 1.7;

      if (kind === 'speed') {
        const cx = W * 0.5, cy = H * 0.45;       // vanishing point (where the track recedes)
        const maxR = Math.hypot(W, H) * 0.72;
        ctx.lineCap = 'round';
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          // race inward toward the vanishing point (with the train going forward);
          // faster in the foreground, slowing as it recedes into the distance.
          p.rad -= p.spd * (0.25 + p.rad * 0.014) * speed * dt / 16;
          if (p.rad < 4) { parts.splice(i, 1); continue; }
          const fade = Math.min(1, p.rad / (maxR * 0.55)); // dim + thin as it recedes
          const len = 6 + p.rad * 0.32;
          const co = Math.cos(p.ang), si = Math.sin(p.ang);
          const ix = cx + co * p.rad, iy = cy + si * p.rad;            // inner (leading, into distance)
          const ox = cx + co * (p.rad + len), oy = cy + si * (p.rad + len); // outer (trailing, foreground)
          const grad = ctx.createLinearGradient(ix, iy, ox, oy);
          grad.addColorStop(0, rgba(0));
          grad.addColorStop(1, rgba(p.a * fade));
          ctx.strokeStyle = grad; ctx.lineWidth = Math.max(0.5, p.w * fade);
          ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.stroke();
        }
        raf = requestAnimationFrame(loop);
        return;
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        p.x += (p.vx + (kind === 'bubbles' ? Math.sin(p.life / 320 + p.r) * 0.25 : 0)) * speed * dt / 16;
        p.y += p.vy * speed * dt / 16;
        if (p.y < -24) { parts.splice(i, 1); continue; }
        const twinkle = kind === 'steam' ? 1 : 0.55 + 0.45 * Math.sin(p.life / 200 + p.x);
        ctx.globalAlpha = Math.max(0, p.a * twinkle);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (kind === 'bubbles') {
          ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
          ctx.globalAlpha *= 0.25; ctx.fillStyle = color; ctx.fill();
        } else {
          ctx.fillStyle = color; ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [motion, liveMultiplier, stateRef]);

  if (!motion) return null;
  return <canvas ref={ref} className={`scene-motion m-${motion.kind}`} aria-hidden />;
}
