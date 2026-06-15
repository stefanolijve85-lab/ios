'use client';
import { useEffect, useRef } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';

type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; life: number };

// Lightweight ambient motion over the scene: themed particles (bubbles / embers
// / steam) rising up, whose spawn rate + speed scale with the live multiplier.
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

    const parts: Particle[] = [];
    const spawn = () => {
      const x = Math.random() * W;
      if (kind === 'steam') {
        parts.push({ x, y: H + 12, r: 6 + Math.random() * 12, vx: (Math.random() - 0.5) * 0.2, vy: -(0.2 + Math.random() * 0.5), a: 0.05 + Math.random() * 0.07, life: 0 });
      } else if (kind === 'embers') {
        parts.push({ x, y: H + 8, r: 1 + Math.random() * 2, vx: (Math.random() - 0.5) * 0.35, vy: -(0.4 + Math.random() * 1.0), a: 0.55 + Math.random() * 0.4, life: 0 });
      } else { // bubbles
        parts.push({ x, y: H + 8, r: 1.5 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.2, vy: -(0.3 + Math.random() * 0.8), a: 0.4 + Math.random() * 0.4, life: 0 });
      }
    };

    let raf = 0, acc = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(50, t - last); last = t;
      const running = stateRef.current?.phase === 'running';
      const m = running ? liveMultiplier() : 1;
      const intensity = running ? Math.min(1, 0.3 + (m - 1) * 0.06) : 0.18; // gentle ambient when idle
      acc += dt * intensity * (kind === 'steam' ? 0.04 : 0.13);
      while (acc > 1) { if (parts.length < 75) spawn(); acc -= 1; }

      ctx.clearRect(0, 0, W, H);
      const speed = 0.6 + intensity * 1.7;
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
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [motion, liveMultiplier, stateRef]);

  if (!motion) return null;
  return <canvas ref={ref} className={`scene-motion m-${motion.kind}`} aria-hidden />;
}
