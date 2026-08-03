'use client';

import React, { useState } from 'react';
import { useSlot } from '@/hooks/useSlot';
import { money } from '@/game/format';

// Lightweight sheets for the non-reel bottom-nav tabs (Missions, Rewards, Race,
// Chat). Rewards is interactive (daily claim + play-money top-up via the server);
// the rest present live progression so the app-shell feels complete.
export function PanelSheet({ tab, onClose }: { tab: string; onClose: () => void }) {
  const { session, claimDaily, credit } = useSlot();
  const [msg, setMsg] = useState('');
  const level = session?.level ?? 1;

  const missions = [
    { label: 'Spin the reels 20 times', goal: 20, val: Math.min(20, Math.floor((session?.xp ?? 0) / 3)), reward: 100 },
    { label: 'Open the Quantum Portal', goal: 1, val: session?.freeSpins.total ? 1 : 0, reward: 300 },
    { label: `Reach level ${level + 1}`, goal: level + 1, val: level, reward: 250 },
    { label: 'Land a ×5 multiplier', goal: 1, val: 0, reward: 200 },
  ];

  return (
    <div className="qs-modal-scrim" onClick={onClose}>
      <div className="qs-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qs-modal-close" onClick={onClose}>×</button>

        {tab === 'missions' && (
          <>
            <h3>Daily Missions</h3>
            {missions.map((m, i) => {
              const pct = Math.min(100, (m.val / m.goal) * 100);
              return (
                <div className="qs-field" key={i}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{m.label}</span>
                    <span>+{m.reward} XP</span>
                  </label>
                  <span className="qs-xp-bar" style={{ display: 'block', height: 8 }}>
                    <span className="qs-xp-fill" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              );
            })}
          </>
        )}

        {tab === 'rewards' && (
          <>
            <h3>Rewards</h3>
            <p className="qs-mono" style={{ marginTop: -6 }}>Balance: {money(session?.balance ?? 0, undefined, '€')}</p>
            <button
              className="qs-btn"
              style={{ marginTop: 8 }}
              onClick={async () => {
                const r = await claimDaily();
                setMsg(r.claimed ? `Daily reward claimed: +${money(r.amount ?? 0, undefined, '€')}` : 'Daily reward already claimed today.');
              }}
            >
              Claim daily reward
            </button>
            <button className="qs-btn ghost" style={{ marginTop: 10 }} onClick={async () => { await credit(1000); setMsg('Added €1,000 play credits.'); }}>
              Add €1,000 play credits
            </button>
            {msg && <p className="qs-mono" style={{ marginTop: 10, color: 'var(--qs-neon)' }}>{msg}</p>}
          </>
        )}

        {tab === 'race' && (
          <>
            <h3>Leaderboard Race</h3>
            <p className="qs-mono" style={{ marginTop: -6 }}>Season 1 · biggest win multiplier wins the pot.</p>
            {[['QuantumKid', '1,204×'], ['NovaByte', '842×'], ['You', '—'], ['R3actor', '511×']].map(([n, x], i) => (
              <div className="qs-pt-row" key={i} style={{ justifyContent: 'space-between' }}>
                <span><b>#{i + 1}</b> {n}</span>
                <span>{x}</span>
              </div>
            ))}
          </>
        )}

        {tab === 'chat' && (
          <>
            <h3>Live Chat</h3>
            <p className="qs-mono" style={{ marginTop: -6 }}>Community chat connects in the multiplayer build (see the development plan).</p>
            {['NovaByte: portal incoming 🌀', 'R3actor: GRAND just dropped!!', 'QuantumKid: turbo gang'].map((c, i) => (
              <div className="qs-pt-row" key={i}>{c}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
