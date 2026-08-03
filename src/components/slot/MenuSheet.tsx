'use client';

import React, { useState } from 'react';
import { useSlot } from '@/hooks/useSlot';

// Menu + Provably-Fair panel. Shows the current commitment (server-seed hash),
// lets the player set their own client seed, and reveals+rotates the server
// seed so past rounds can be verified on /quantum/verify.
export function MenuSheet({ onClose }: { onClose: () => void }) {
  const { session, setClientSeed, rotateSeed, muted, toggleMute } = useSlot();
  const [seedInput, setSeedInput] = useState('');
  const [revealed, setRevealed] = useState<{ serverSeed: string; serverSeedHash: string; clientSeed: string; spins: number } | null>(null);
  const f = session?.fairness;

  return (
    <div className="qs-modal-scrim" onClick={onClose}>
      <div className="qs-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qs-modal-close" onClick={onClose}>×</button>
        <h3>Provably Fair</h3>
        <p className="qs-mono" style={{ marginTop: -6 }}>
          Every spin is decided server-side and bound to a seed the server committed to
          <b> before</b> you spun. Verify any round with zero trust.
        </p>

        <div className="qs-field" style={{ marginTop: 12 }}>
          <label>SERVER SEED HASH (commitment)</label>
          <div className="qs-input">{f?.serverSeedHash ?? '—'}</div>
        </div>
        <div className="qs-field">
          <label>YOUR CLIENT SEED</label>
          <div className="qs-input">{f?.clientSeed ?? '—'}</div>
        </div>
        <div className="qs-field">
          <label>NEXT NONCE</label>
          <div className="qs-input">{f?.nonce ?? 0}</div>
        </div>

        <div className="qs-field">
          <label>SET A NEW CLIENT SEED</label>
          <input
            className="qs-input"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder="type your own entropy…"
          />
        </div>
        <button
          className="qs-btn ghost"
          style={{ marginBottom: 10 }}
          onClick={async () => {
            if (seedInput.trim()) {
              await setClientSeed(seedInput.trim());
              setSeedInput('');
            }
          }}
        >
          Apply client seed
        </button>

        <button
          className="qs-btn"
          style={{ marginBottom: 10 }}
          onClick={async () => {
            const r = await rotateSeed();
            if (r) setRevealed(r);
          }}
        >
          Reveal &amp; rotate server seed
        </button>

        {revealed && (
          <div className="qs-field">
            <label>REVEALED SERVER SEED ({revealed.spins} spins) — verify it hashes to the commitment above</label>
            <div className="qs-input">{revealed.serverSeed}</div>
            <a
              className="qs-btn ghost"
              style={{ display: 'block', marginTop: 8, textAlign: 'center', textDecoration: 'none' }}
              href={`/quantum/verify?serverSeed=${revealed.serverSeed}&clientSeed=${encodeURIComponent(revealed.clientSeed)}&hash=${revealed.serverSeedHash}&sid=${session?.id}`}
            >
              Open verifier →
            </a>
          </div>
        )}

        <a
          className="qs-btn ghost"
          style={{ display: 'block', marginTop: 6, textAlign: 'center', textDecoration: 'none' }}
          href="/quantum/verify"
        >
          Verification page
        </a>

        <h3 style={{ marginTop: 18 }}>Settings</h3>
        <button className="qs-btn ghost" onClick={toggleMute}>
          Sound: {muted ? 'OFF' : 'ON'}
        </button>
      </div>
    </div>
  );
}
