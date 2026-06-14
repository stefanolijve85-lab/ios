'use client';
import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { verifyRound, type VerifyResult } from '@/lib/fairness';
import { RTP, HOUSE_EDGE } from '@/lib/constants';

export default function FairnessModal({ onClose }: { onClose: () => void }) {
  const { fair } = useGame();
  const last = fair.last;
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);

  const runVerify = async () => {
    if (!last) return;
    setBusy(true);
    try {
      setResult(await verifyRound(last.serverSeed, last.serverSeedHash, last.roundId, last.crashPoint));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fair-scrim" onClick={onClose}>
      <div className="fair-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fair-head">
          <span>🔒 PROVABLY FAIR</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <p className="fair-intro">
          Every round&apos;s crash point is locked in <b>before</b> any bets are placed.
          The server publishes a commitment (a hash) up front and reveals the secret
          seed after the round, so you can prove the outcome was never changed.
          House edge <b>{Math.round(HOUSE_EDGE * 100)}%</b> · RTP <b>{Math.round(RTP * 100)}%</b> — the
          same for every Olive Games title.
        </p>

        <div className="fair-block">
          <div className="fair-label">THIS ROUND · COMMITMENT (published before bets)</div>
          <code className="fair-mono">{fair.commitment ?? '—'}</code>
        </div>

        {last ? (
          <>
            <div className="fair-block">
              <div className="fair-label">LAST ROUND #{last.roundId} · REVEALED</div>
              <div className="fair-row"><span>Crash point</span><b>{last.crashPoint.toFixed(2)}x</b></div>
              <div className="fair-kv"><span>Commitment (hash)</span><code className="fair-mono">{last.serverSeedHash}</code></div>
              <div className="fair-kv"><span>Server seed (revealed)</span><code className="fair-mono">{last.serverSeed}</code></div>
            </div>

            <button className="fair-verify" onClick={runVerify} disabled={busy}>
              {busy ? 'VERIFYING…' : 'VERIFY THIS ROUND'}
            </button>

            {result && (
              <div className={`fair-result ${result.hashOk && result.crashOk ? 'ok' : 'bad'}`}>
                <div>{result.hashOk ? '✓' : '✗'} SHA-256(seed) matches the commitment</div>
                <div>{result.crashOk ? '✓' : '✗'} Crash point recomputes to {result.computedCrash.toFixed(2)}x</div>
                <div className="fair-verdict">
                  {result.hashOk && result.crashOk ? 'FAIR — verified in your browser' : 'MISMATCH'}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="fair-block fair-wait">Play a round — the revealed seed will appear here to verify.</div>
        )}
      </div>
    </div>
  );
}
