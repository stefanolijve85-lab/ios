'use client';

import { useRef } from 'react';

export function VBrightness({
  value,
  color,
  onChange,
}: {
  value: number; // 1-100
  color: string;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.max(1, Math.min(100, Math.round(pct * 100))));
  };
  const down = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    set(e.clientY);
  };
  const move = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pressure === 0) return;
    set(e.clientY);
  };
  return (
    <div className="vslider" ref={ref} onPointerDown={down} onPointerMove={move}>
      <div className="fill" style={{ height: `${value}%`, background: color }} />
      <div className="label">{value}%</div>
    </div>
  );
}

export function HSlider({
  value,
  min,
  max,
  track,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  track: string;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = (value - min) / (max - min);
  const set = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(min + p * (max - min)));
  };
  const down = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    set(e.clientX);
  };
  const move = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pressure === 0) return;
    set(e.clientX);
  };
  return (
    <div className="hslider" ref={ref} style={{ background: track }} onPointerDown={down} onPointerMove={move}>
      <div className="thumb" style={{ left: `calc(${pct * 100}% )` }} />
    </div>
  );
}
