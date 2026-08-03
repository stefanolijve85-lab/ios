'use client';

import React, { useMemo } from 'react';
import type { SlotTheme } from '@/game/theme';

// Living cyberpunk backdrop: layered parallax gradients (theme-driven), a faint
// scrolling neon skyline and floating energy particles. Pure CSS so it holds
// 60fps on mobile. Reacts to device tilt where available for subtle depth.
export function Background({ theme }: { theme: SlotTheme }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        // deterministic pseudo-random so SSR and client match (no hydration jump)
        const s = (i * 2654435761) % 1000 / 1000;
        const s2 = (i * 40503) % 1000 / 1000;
        return {
          left: `${Math.round(s * 100)}%`,
          size: 2 + Math.round(s2 * 4),
          duration: 9 + Math.round(s * 12),
          delay: -Math.round(s2 * 12),
          hue: i % 3,
        };
      }),
    [],
  );

  return (
    <div className="qs-bg" aria-hidden>
      {theme.background.map((layer, i) => (
        <div
          key={i}
          className="qs-bg-layer"
          style={{ background: layer.css, filter: layer.blur ? `blur(${layer.blur}px)` : undefined }}
        />
      ))}
      <div className="qs-city" />
      <div className="qs-particles">
        {particles.map((p, i) => (
          <span
            key={i}
            className="qs-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              background: p.hue === 0 ? theme.colors.neon : p.hue === 1 ? theme.colors.neon2 : theme.colors.gold,
              boxShadow: `0 0 8px ${p.hue === 0 ? theme.colors.neon : p.hue === 1 ? theme.colors.neon2 : theme.colors.gold}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
