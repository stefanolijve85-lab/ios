'use client';

import React from 'react';

// The app-shell bottom navigation from the reference (Lobby / Missions /
// Rewards / Race / Chat). Non-game tabs open lightweight panels.
const TABS = [
  { key: 'lobby', label: 'LOBBY', ico: '🏠' },
  { key: 'missions', label: 'MISSIONS', ico: '🎯', badge: true },
  { key: 'rewards', label: 'REWARDS', ico: '🎁' },
  { key: 'race', label: 'RACE', ico: '🏁', count: 1 },
  { key: 'chat', label: 'CHAT', ico: '💬', badge: true },
] as const;

export function BottomNav({ active, onSelect }: { active: string; onSelect: (k: string) => void }) {
  return (
    <nav className="qs-bottomnav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`qs-nav-item${active === t.key ? ' active' : ''}`}
          onClick={() => onSelect(t.key)}
        >
          {'badge' in t && t.badge && <span className="qs-nav-badge" />}
          <span className="ico" aria-hidden>{t.ico}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
