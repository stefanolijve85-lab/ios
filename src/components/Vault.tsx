'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LADDER, MAX_RUN_MS } from '@/lib/constants';
import { euro, clock } from '@/lib/format';

export default function Vault() {
  const { stateRef, liveMultiplier, serverNow, bets } = useGame();
  const amountRef = useRef<HTMLDivElement>(null);
  const multRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [rung, setRung] = useState(1);
  const [phase, setPhase] = useState('betting');
  const [crashPoint, setCrashPoint] = useState(0);
  const [warn, setWarn] = useState(false);
  const [cdLabel, setCdLabel] = useState('THIEVES ARRIVING IN');

  const activeStake =
    (bets[0] && !bets[0]!.cashedOut ? bets[0]!.amount : 0) +
    (bets[1] && !bets[1]!.cashedOut ? bets[1]!.amount : 0);
  const stakeRef = useRef(activeStake);
  stakeRef.current = activeStake;

  useEffect(() => {
    let raf = 0;
    let lastRung = -1, lastPhase = '', lastWarn = false, lastLabel = '';
    const loop = () => {
      const s = stateRef.current;
      const m = liveMultiplier();
      const stake = stakeRef.current || 100;
      const amount = stake * m;

      if (amountRef.current) amountRef.current.textContent = euro(amount);
      if (multRef.current) multRef.current.textContent = m.toFixed(2) + 'x';

      // countdown + danger
      let danger = false, text = '00:00', w = false, lbl = 'THIEVES ARRIVING IN';
      if (s?.phase === 'running' && s.startTime) {
        const remaining = MAX_RUN_MS - (serverNow() - s.startTime);
        text = clock(remaining);
        w = remaining <= 5000;
        danger = remaining <= 6000;
      } else if (s?.phase === 'crashed') {
        text = 'STOLEN'; w = true; lbl = 'THE VAULT WAS';
      } else if (s?.phase === 'betting') {
        text = clock((s.phaseEndsAt ?? 0) - serverNow()); lbl = 'VAULT CLOSES IN';
      }
      if (timeRef.current) timeRef.current.textContent = text;
      if (w !== lastWarn) { setWarn(w); lastWarn = w; }
      if (lbl !== lastLabel) { setCdLabel(lbl); lastLabel = lbl; }

      if (glowRef.current) glowRef.current.style.opacity = String(0.3 + Math.min(0.7, (m - 1) * 0.12));

      let active = LADDER[LADDER.length - 1];
      for (let i = LADDER.length - 1; i >= 0; i--) if (m >= LADDER[i]) active = LADDER[i];
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
    <div className="vault" ref={vaultRef}>
      {/* full vault scene render */}
      <div className="vault-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vault.webp" alt="Vault" draggable={false} />
      </div>
      <div className="vault-glow" ref={glowRef} />

      {/* center readout */}
      <div className="vault-readout">
        <div className="label">CURRENT AMOUNT</div>
        <div className="amount" ref={amountRef}>€0.00</div>
        <div className="mult" ref={multRef}>1.00x</div>
      </div>

      {/* multiplier ladder, overlaid on the right */}
      <div className="vault-ladder">
        {LADDER.map((r) => (
          <div
            key={r}
            className={`rung${r === rung ? ' active' : ''}${r >= 15 ? ' top' : r >= 5 ? ' hot' : ''}`}
          >
            {r.toFixed(2)}x
          </div>
        ))}
      </div>

      {/* thief countdown, overlaid over the bottom of the vault */}
      <div className={`vault-countdown${warn ? ' warn' : ''}`}>
        <div className="lbl">🚨 {cdLabel}</div>
        <div className="time" ref={timeRef}>00:00</div>
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
  );
}
