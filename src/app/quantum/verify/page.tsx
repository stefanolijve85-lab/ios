'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import '../quantum.css';
import { PfRng } from '@/game/rng';
import { spin as clientSpin, outcomeHash } from '@/game/engine';
import { commitment } from '@/game/fairness';
import { makeConfig } from '@/game/config';
import { getSlotTheme } from '@/game/theme';
import { SymbolTile } from '@/components/slot/SymbolTile';
import { money } from '@/game/format';
import type { SpinResult } from '@/game/types';

// ---------------------------------------------------------------------------
// The trustless verifier. Everything below runs IN THE BROWSER:
//   1. Check sha256(serverSeed) === the commitment shown before the round.
//   2. Re-derive the entire spin from (serverSeed, clientSeed, nonce) using the
//      same maths as the server (src/game/engine.ts) — reels, tumbles, wins.
//   3. Hash the reproduced outcome and (optionally) compare it to the outcome
//      hash the server recorded for that round.
// If step 1 passes and the reproduced grid/win matches what you were paid, the
// round is provably honest — the server could not have known your result when
// it committed to the seed.
// ---------------------------------------------------------------------------

const theme = getSlotTheme('quantumspin');

function rootVars(): React.CSSProperties {
  return {
    ['--qs-bg-top' as string]: theme.colors.bgTop,
    ['--qs-bg-bottom' as string]: theme.colors.bgBottom,
    ['--qs-neon' as string]: theme.colors.neon,
    ['--qs-neon2' as string]: theme.colors.neon2,
    ['--qs-gold' as string]: theme.colors.gold,
    ['--qs-panel' as string]: theme.colors.panel,
    ['--qs-panel-border' as string]: theme.colors.panelBorder,
    ['--qs-text' as string]: theme.colors.text,
    ['--qs-text-dim' as string]: theme.colors.textDim,
  } as React.CSSProperties;
}

function VerifyInner() {
  const params = useSearchParams();
  const [serverSeed, setServerSeed] = useState(params.get('serverSeed') ?? '');
  const [clientSeed, setClientSeed] = useState(params.get('clientSeed') ?? '');
  const [nonce, setNonce] = useState(params.get('nonce') ?? '0');
  const [expectedHash, setExpectedHash] = useState(params.get('hash') ?? '');
  const [lineBet, setLineBet] = useState('0.1');
  const [rtp, setRtp] = useState('96');
  const [busy, setBusy] = useState(false);

  const [result, setResult] = useState<SpinResult | null>(null);
  const [computedCommitment, setComputedCommitment] = useState('');
  const [computedOutcomeHash, setComputedOutcomeHash] = useState('');
  const [err, setErr] = useState('');

  const run = async () => {
    setErr('');
    setResult(null);
    if (!serverSeed) { setErr('Enter a revealed server seed.'); return; }
    setBusy(true);
    try {
      const config = makeConfig(rtp);
      const rng = await PfRng.create(serverSeed, clientSeed, parseInt(nonce || '0', 10));
      const r = clientSpin(config, rng, parseFloat(lineBet || '0.1'), false);
      const comm = await commitment(serverSeed);
      const oh = await outcomeHash(r);
      setResult(r);
      setComputedCommitment(comm);
      setComputedOutcomeHash(oh);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // auto-run when arriving with query params
  useEffect(() => {
    if (params.get('serverSeed')) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hashOk = expectedHash ? computedCommitment.toLowerCase() === expectedHash.toLowerCase() : null;

  return (
    <div className="qs-root" style={{ ...rootVars(), position: 'relative', overflowY: 'auto' }}>
      <div className="qs-viewport" style={{ maxWidth: 620, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.04em', marginTop: 10 }}>
          QUANTUM SPIN · Fairness Verifier
        </h1>
        <p className="qs-mono">Re-derive any round in your own browser. Nothing here trusts the server.</p>

        <div className="qs-glass" style={{ padding: 14, borderRadius: 16, marginTop: 10 }}>
          <Field label="REVEALED SERVER SEED" value={serverSeed} onChange={setServerSeed} mono />
          <Field label="CLIENT SEED" value={clientSeed} onChange={setClientSeed} mono />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="NONCE" value={nonce} onChange={setNonce} />
            <Field label="BET / LINE" value={lineBet} onChange={setLineBet} />
            <div className="qs-field">
              <label>RTP BAND</label>
              <select className="qs-input" value={rtp} onChange={(e) => setRtp(e.target.value)}>
                {['92', '94', '96', '97'].map((b) => <option key={b} value={b}>{b}%</option>)}
              </select>
            </div>
          </div>
          <Field label="COMMITMENT (server seed hash) — optional, to check" value={expectedHash} onChange={setExpectedHash} mono />
          <button className="qs-btn" onClick={run} disabled={busy}>{busy ? 'Verifying…' : 'Verify round'}</button>
          {err && <p style={{ color: '#ff6b7f', marginTop: 8 }} className="qs-mono">{err}</p>}
        </div>

        {result && (
          <div className="qs-glass" style={{ padding: 14, borderRadius: 16, marginTop: 12 }}>
            <Check
              ok={hashOk}
              label="Commitment check"
              detail={hashOk === null
                ? 'No commitment supplied — sha256(serverSeed) shown below to compare manually.'
                : hashOk ? 'sha256(serverSeed) matches the published commitment.' : 'MISMATCH — this seed does not match the commitment.'}
            />
            <div className="qs-field">
              <label>sha256(serverSeed)</label>
              <div className="qs-input">{computedCommitment}</div>
            </div>

            <h3 style={{ marginTop: 6 }}>Reproduced initial board</h3>
            <div className="qs-machine" style={{ padding: 8 }}>
              <div className="qs-grid">
                {result.initialGrid.map((col, c) => (
                  <div className="qs-reel" key={c}>
                    {col.map((sym, r) => <SymbolTile key={`${c}-${r}`} id={sym} theme={theme} />)}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <Stat label="Tumbles" value={String(result.steps.filter((s) => s.wins.length > 0).length)} />
              <Stat label="Final multiplier" value={`×${result.multiplier}`} />
              <Stat label="Scatters" value={String(result.scatter.count)} />
              <Stat label="Free spins won" value={String(result.freeSpins.awarded)} />
              <Stat label="Line + scatter win" value={money(result.win, undefined, '€')} />
              <Stat label="Jackpot" value={result.jackpot ? result.jackpot.tier : '—'} />
            </div>

            <div className="qs-field" style={{ marginTop: 12 }}>
              <label>REPRODUCED OUTCOME HASH</label>
              <div className="qs-input">{computedOutcomeHash}</div>
            </div>
            <p className="qs-mono">
              Compare this to the outcome hash your game recorded for nonce {nonce}. If they match, the
              exact board, tumbles and win were fixed the instant the server committed to the seed.
            </p>
          </div>
        )}

        <a className="qs-btn ghost" href="/quantum" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 14 }}>
          ← Back to the game
        </a>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div className="qs-field">
      <label>{label}</label>
      <input className="qs-input" style={mono ? undefined : { fontFamily: 'inherit' }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="qs-pt-row" style={{ justifyContent: 'space-between' }}>
      <span className="cap" style={{ fontSize: 11, color: 'var(--qs-text-dim)' }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function Check({ ok, label, detail }: { ok: boolean | null; label: string; detail: string }) {
  const color = ok === null ? 'var(--qs-text-dim)' : ok ? '#57e389' : '#ff6b7f';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 800, color }}>{ok === null ? '•' : ok ? '✓' : '✗'} {label}</div>
      <div className="qs-mono">{detail}</div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="qs-root" style={rootVars()} />}>
      <VerifyInner />
    </Suspense>
  );
}
