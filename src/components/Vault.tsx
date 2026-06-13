'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LADDER } from '@/lib/constants';
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

      // betting countdown (legit) + tension glow (driven by stake size, not time)
      let danger = false, text = '00:00', w = false, lbl = 'VAULT CLOSES IN';
      if (s?.phase === 'running') {
        danger = m >= 5; // bigger stash = redder, hotter — no timing hint
      } else if (s?.phase === 'betting') {
        const remaining = (s.phaseEndsAt ?? 0) - serverNow();
        text = clock(remaining);
        w = remaining <= 2500;
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
      {/* full vault scene render — swaps to the heist shot when robbed */}
      <div className="vault-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={phase === 'crashed' ? '/heist.webp' : '/vault.webp'} alt="Vault" draggable={false} />
      </div>
      <div className="vault-glow" ref={glowRef} />

      {/* center readout (hidden during the robbery) */}
      {phase !== 'crashed' && (
        <div className="vault-readout">
          <div className="label">CURRENT AMOUNT</div>
          <div className="amount" ref={amountRef}>€0.00</div>
          <div className="mult" ref={multRef}>1.00x</div>
        </div>
      )}

      {/* multiplier ladder, overlaid on the right (hidden during the robbery) */}
      {phase !== 'crashed' && (
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
      )}

      {/* countdown only while betting — during a round the crash is unpredictable */}
      {phase === 'betting' && (
        <div className={`vault-countdown${warn ? ' warn' : ''}`}>
          <div className="cd-pill">
            <span className="lbl">🔒 {cdLabel}</span>
            <span className="time" ref={timeRef}>00:00</span>
          </div>
        </div>
      )}

      {phase === 'crashed' && (
        <div className="heist">
          <div className="thiefword">THIEVES STOLE IT</div>
          <div className="thiefat">@ {crashPoint.toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
}
