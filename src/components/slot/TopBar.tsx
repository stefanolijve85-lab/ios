'use client';

import React from 'react';
import { useSlot } from '@/hooks/useSlot';
import { money } from '@/game/format';

// Top HUD: avatar + level/XP, balance (+add), rewards, leaderboard, menu.
export function TopBar({ onMenu, onRewards }: { onMenu: () => void; onRewards: () => void }) {
  const { session, muted, toggleMute } = useSlot();
  const level = session?.level ?? 1;
  const xp = session?.xp ?? 0;
  const need = 100 * level * level;
  const prev = 100 * (level - 1) * (level - 1);
  const pct = Math.max(0, Math.min(100, ((xp - prev) / (need - prev)) * 100));

  return (
    <div className="qs-topbar qs-glass">
      <div className="qs-avatar" aria-hidden>🧑‍🚀</div>
      <div className="qs-player">
        <div className="qs-player-name">PLAYER 1</div>
        <div className="qs-xp">
          <span>LVL {level}</span>
          <span className="qs-xp-bar">
            <span className="qs-xp-fill" style={{ width: `${pct}%` }} />
          </span>
        </div>
      </div>
      <div className="qs-balance">
        <div className="qs-balance-label">BALANCE</div>
        <div className="qs-balance-value">
          {money(session?.balance ?? 0, session?.currency, '€')}
        </div>
      </div>
      <button className="qs-icon-btn" onClick={toggleMute} aria-label="sound">
        {muted ? '🔇' : '🔊'}
      </button>
      <button className="qs-icon-btn" onClick={onRewards} aria-label="rewards">🎁</button>
      <button className="qs-icon-btn" onClick={onMenu} aria-label="menu">☰</button>
    </div>
  );
}
