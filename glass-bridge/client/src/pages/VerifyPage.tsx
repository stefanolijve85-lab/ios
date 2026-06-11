import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { computeRound, deriveBreakProbabilities, sha256Hex } from '../lib/provablyFair.js';
import { api } from '../lib/api.js';
import type { RowOutcome } from '../lib/types.js';

const DEFAULT_MULTS = [1.03, 1.08, 1.15, 1.24, 1.36, 1.51, 1.7, 1.95, 2.3, 2.8, 3.5, 4.5];

export default function VerifyPage() {
  const [params] = useSearchParams();
  const [serverSeed, setServerSeed] = useState(params.get('serverSeed') ?? '');
  const [clientSeed, setClientSeed] = useState(params.get('clientSeed') ?? '');
  const [nonce, setNonce] = useState(Number(params.get('nonce') ?? 1));
  const [houseEdge, setHouseEdge] = useState(0.02);
  const [mults, setMults] = useState<number[]>(DEFAULT_MULTS);
  const [hash, setHash] = useState('');
  const [layout, setLayout] = useState<RowOutcome[]>([]);

  useEffect(() => {
    api.config().then((c) => setMults(c.multipliers)).catch(() => {});
  }, []);

  async function run() {
    if (!serverSeed || !clientSeed) return;
    setHash(await sha256Hex(serverSeed));
    setLayout(await computeRound(serverSeed, clientSeed, nonce, mults, houseEdge));
  }

  useEffect(() => {
    if (serverSeed && clientSeed) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breakProbs = deriveBreakProbabilities(mults, houseEdge);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/" className="text-sm text-white/50 hover:text-white">
        ← Back to game
      </Link>
      <h1 className="mb-1 mt-2 font-display text-3xl font-black neon-text">Provably Fair Verification</h1>
      <p className="mb-4 max-w-2xl text-sm text-white/60">
        Every round commits to a SHA-256 hash of a secret server seed <em>before</em> you play. After the round the
        server seed is revealed. This page recomputes the entire bridge in your browser (Web Crypto, no server trust):
        for each row, <code>HMAC-SHA256(serverSeed, clientSeed:nonce:row)</code> determines the rigged side and whether
        the trap is armed. You fall only if your pick matched an armed trap.
      </p>

      <div className="glass-panel grid gap-3 p-4 sm:grid-cols-2">
        <Field label="Server seed (revealed)" value={serverSeed} onChange={setServerSeed} />
        <Field label="Client seed" value={clientSeed} onChange={setClientSeed} />
        <Field label="Nonce" value={String(nonce)} onChange={(v) => setNonce(Number(v) || 0)} />
        <Field label="House edge" value={String(houseEdge)} onChange={(v) => setHouseEdge(Number(v) || 0)} />
        <button onClick={run} className="btn bg-gradient-to-r from-neon-purple to-neon-blue py-2.5 text-white sm:col-span-2">
          RECOMPUTE
        </button>
      </div>

      {hash && (
        <div className="glass-panel mt-4 break-all p-4 text-sm">
          <span className="text-white/50">Computed SHA-256(serverSeed): </span>
          <span className="font-mono text-neon-cyan">{hash}</span>
          <p className="mt-1 text-xs text-white/40">Compare this to the hash that was shown before the round started.</p>
        </div>
      )}

      {layout.length > 0 && (
        <div className="glass-panel mt-4 overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-white/40">
              <tr>
                <th className="p-2">Row</th>
                <th className="p-2">Multiplier</th>
                <th className="p-2">Break prob.</th>
                <th className="p-2">Trap side</th>
                <th className="p-2">Roll</th>
                <th className="p-2">Armed</th>
              </tr>
            </thead>
            <tbody>
              {layout.map((r, i) => (
                <tr key={r.row} className="border-t border-white/5">
                  <td className="p-2">{r.row}</td>
                  <td className="p-2 text-neon-cyan">{r.multiplier.toFixed(2)}×</td>
                  <td className="p-2 text-white/60">{(breakProbs[i] * 100).toFixed(1)}%</td>
                  <td className="p-2">{r.trapSide}</td>
                  <td className="p-2 font-mono text-white/50">{r.roll.toFixed(5)}</td>
                  <td className={`p-2 ${r.armed ? 'text-neon-pink' : 'text-neon-green'}`}>{r.armed ? 'YES' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-white/40">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs outline-none"
      />
    </label>
  );
}
