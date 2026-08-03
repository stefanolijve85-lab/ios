'use client';

import React from 'react';
import { useSlot } from '@/hooks/useSlot';
import { SymbolTile } from './SymbolTile';

// The 5×3 reel machine. Reads the current display grid + winning cells from the
// controller; the controller advances these through the resolved spin's tumble
// steps. Each cell re-mounts on dropKey change so the CSS drop animation fires.
export function Reels() {
  const { grid, winCells, theme, dropKey, spinning } = useSlot();

  return (
    <div className="qs-machine">
      <div className="qs-grid" aria-label="reels">
        {grid.map((col, c) => (
          <div className="qs-reel" key={c}>
            {col.map((sym, r) => (
              <SymbolTile
                key={`${c}-${r}-${dropKey}`}
                dropKey={dropKey}
                id={sym}
                theme={theme}
                win={winCells.has(`${c},${r}`)}
                drop={spinning}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
