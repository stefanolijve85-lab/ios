'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LADDER, MAX_RUN_MS, MAX_MULTIPLIER } from '@/lib/constants';
import { euro } from '@/lib/format';

const MAX_BRICKS = 44;

export default function Vault() {
  const { stateRef, liveMultiplier, serverNow, bets } = useGame();
  const amountRef = useRef<HTMLDivElement>(null);
  const multRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);

  const [bricks, setBricks] = useState(0);
  const [rung, setRung] = useState(1);
  const [phase, setPhase] = useState('betting');
  const [crashPoint, setCrashPoint] = useState(0);

  // Active stake drives the central "current amount" the player could lock.
  const activeStake =
    (bets[0] && !bets[0]!.cashedOut ? bets[0]!.amount : 0) +
    (bets[1] && !bets[1]!.cashedOut ? bets[1]!.amount : 0);
  const stakeRef = useRef(activeStake);
  stakeRef.current = activeStake;

  useEffect(() => {
    let raf = 0;
    let lastBricks = -1;
    let lastRung = -1;
    let lastPhase = '';
    const loop = () => {
      const s = stateRef.current;
      const m = liveMultiplier();
      const stake = stakeRef.current || 100; // illustrative pot if not betting
      const amount = stake * m;

      if (amountRef.current) amountRef.current.textContent = euro(amount);
      if (multRef.current) multRef.current.textContent = m.toFixed(2) + 'x';

      // fill the pile by elapsed time so it grows steadily and satisfyingly
      let fill = 0;
      let danger = false;
      if (s && s.phase === 'running' && s.startTime) {
        const elapsed = serverNow() - s.startTime;
        fill = Math.min(1, elapsed / MAX_RUN_MS);
        danger = elapsed > 9000;
      } else if (s && s.phase === 'crashed') {
        fill = 0;
      }
      const b = Math.round(fill * MAX_BRICKS);
      if (b !== lastBricks) { setBricks(b); lastBricks = b; }

      // active ladder rung = lowest rung the multiplier has reached
      let active = LADDER[LADDER.length - 1];
      for (let i = LADDER.length - 1; i >= 0; i--) {
        if (m >= LADDER[i]) active = LADDER[i];
      }
      if (active !== lastRung) { setRung(active); lastRung = active; }

      if (vaultRef.current) vaultRef.current.classList.toggle('danger', danger);

      const ph = s?.phase ?? 'betting';
      if (ph !== lastPhase) {
        setPhase(ph);
        if (ph === 'crashed') setCrashPoint(s?.crashPoint ?? m);
        lastPhase = ph;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [liveMultiplier, serverNow, stateRef]);

  return (
    <div className="vault-wrap">
      <div className="vault" ref={vaultRef}>
        <div className="vault-inner">
          {/* money pile */}
          <div className="pile">
            {Array.from({ length: bricks }).map((_, i) => (
              <div key={i} className={`brick${i % 6 === 5 ? ' bar' : ''}`} />
            ))}
          </div>

          <div className="vault-readout">
            <div className="label">CURRENT AMOUNT</div>
            <div className="amount" ref={amountRef}>€0.00</div>
            <div className="mult" ref={multRef}>1.00x</div>
          </div>

          {phase === 'crashed' && (
            <div className="heist">
              <div>
                <div className="silhouette">🦹‍♂️💨</div>
                <div className="thiefword">THIEVES BROKE IN<br />@ {crashPoint.toFixed(2)}x</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* multiplier ladder */}
      <div className="ladder">
        {LADDER.map((r) => (
          <div
            key={r}
            className={`rung${r === rung ? ' active' : ''}${r >= 15 ? ' top' : r >= 5 ? ' hot' : ''}`}
          >
            {r.toFixed(2)}x
          </div>
        ))}
      </div>
    </div>
  );
}
