'use client';

import { useRef } from 'react';
import { hsvToRgb, rgbCss } from '@/lib/color';

export default function ColorWheel({
  hue,
  saturation,
  size = 260,
  onChange,
}: {
  hue: number;
  saturation: number;
  size?: number;
  onChange: (hue: number, saturation: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const r = size / 2;

  const handleRad = (saturation / 100) * r;
  const rad = ((hue - 90) * Math.PI) / 180; // 0° bovenaan
  const hx = r + handleRad * Math.cos(rad);
  const hy = r + handleRad * Math.sin(rad);

  const pick = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - rect.left - r;
    const dy = clientY - rect.top - r;
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (ang < 0) ang += 360;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), r);
    onChange(Math.round(ang), Math.round((dist / r) * 100));
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pick(e.clientX, e.clientY);
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pressure === 0) return;
    pick(e.clientX, e.clientY);
  };

  return (
    <div className="wheel-wrap">
      <div
        ref={ref}
        className="wheel"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 72%), conic-gradient(from 90deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
      >
        <div
          className="handle"
          style={{ left: hx, top: hy, background: rgbCss(hsvToRgb(hue, saturation, 100)) }}
        />
      </div>
    </div>
  );
}
