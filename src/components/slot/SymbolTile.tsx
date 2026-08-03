'use client';

import React, { useEffect, useState } from 'react';
import type { SymbolId } from '@/game/config';
import type { SlotTheme } from '@/game/theme';
import { assets } from '@/game/assets';

// Renders one symbol. Prefers a real image asset (resolved by the AssetManager
// across avif/webp/png/svg); if none is on disk it draws a crafted neon glyph,
// so the game looks complete before any art ships. `win` drives the pulse/flash.
export function SymbolTile({
  id,
  theme,
  win,
  drop,
  dropKey,
}: {
  id: SymbolId;
  theme: SlotTheme;
  win?: boolean;
  drop?: boolean;
  dropKey?: number;
}) {
  const skin = theme.symbols[id];
  const [imgUrl, setImgUrl] = useState<string>('');

  useEffect(() => {
    let alive = true;
    assets.resolveSymbol(id).then((url) => {
      if (alive) setImgUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const style = { ['--sym-accent' as string]: skin.accent ?? `hsl(${skin.hue} 90% 60%)` } as React.CSSProperties;

  return (
    <div
      key={dropKey}
      className={`qs-cell${win ? ' win' : ''}${drop ? ' drop' : ''}`}
      style={style}
      data-sym={id}
    >
      {imgUrl ? (
        <img className="qs-sym-img" src={imgUrl} alt={id} draggable={false} />
      ) : skin.kind === 'royal' ? (
        <span className="qs-sym-royal">{skin.label}</span>
      ) : (
        <div className={skin.kind === 'feature' ? 'qs-sym-feature' : 'qs-sym-premium'}>
          {skin.kind === 'feature' && skin.label ? (
            <span className="qs-sym-badge">{skin.label}</span>
          ) : (
            <span aria-hidden>{skin.icon}</span>
          )}
        </div>
      )}
    </div>
  );
}
