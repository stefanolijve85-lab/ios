'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { QUICK_CHIPS } from '@/lib/constants';
import { euro } from '@/lib/format';

export default function BetPanel({ slot, hero = false }: { slot: 0 | 1; hero?: boolean }) {
  const { state, bets, balance, placeBet, cancelBet, stash, liveMultiplier } = useGame();
  const [amount, setAmount] = useState(10);
  const [pending, setPending] = useState(false); // queued bet for the next round
  const valueRef = useRef<HTMLSpanElement>(null);

  const phase = state?.phase ?? 'betting';
  const bet = bets[slot];
  const holding = !!bet && !bet.cashedOut && !bet.lost;
  const cashed = !!bet && bet.cashedOut;

  // Auto-place a queued bet the moment the next vault opens.
  const amountRef = useRef(amount);
  amountRef.current = amount;
  useEffect(() => {
    if (phase === 'betting' && pending && !bet) {
      placeBet(slot, amountRef.current);
      setPending(false);
    }
  }, [phase, pending, bet, slot, placeBet]);

  // Live potential payout on the STASH button while a round runs.
  useEffect(() => {
    if (!(phase === 'running' && holding)) return;
    let raf = 0;
    const loop = () => {
      if (valueRef.current && bet) {
        valueRef.current.textContent = euro(bet.amount * liveMultiplier());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, holding, bet, liveMultiplier]);

  const step = (d: number) => setAmount((a) => Math.max(1, Math.round((a + d) * 100) / 100));

  // ---- button content + behaviour by state -------------------------------
  let cls = 'stash-btn';
  let onClick: (() => void) | undefined;
  let disabled = false;
  let big = 'STASH';
  let sub: string | null = 'LOCK YOUR WINNINGS';

  if (phase === 'betting') {
    if (holding) {
      cls += ' placed';
      big = '✓ BET PLACED';
      sub = `TAP TO CANCEL · ${euro(bet!.amount)}`;
      onClick = () => cancelBet(slot);
    } else {
      cls += ' place';
      big = 'PLACE BET';
      sub = `${euro(amount)} · VAULT OPEN`;
      onClick = () => placeBet(slot, amount);
      if (amount > balance) disabled = true;
    }
  } else if (phase === 'running' && holding) {
    big = 'STASH';
    sub = 'LOCK YOUR WINNINGS';
    onClick = () => stash(slot);
  } else if (cashed) {
    cls += ' done';
    big = `✓ STASHED ${bet!.cashedAt?.toFixed(2)}x`;
    sub = `+${euro(bet!.payout)}`;
    disabled = true;
  } else if (phase === 'crashed' && bet && !cashed) {
    cls += ' placed';
    big = 'TOO LATE — STOLEN';
    sub = `−${euro(bet.amount)}`;
    disabled = true;
  } else if (pending) {
    // queued for the next round
    cls += ' placed';
    big = '✓ QUEUED';
    sub = `NEXT ROUND · ${euro(amount)} · TAP TO CANCEL`;
    onClick = () => setPending(false);
  } else {
    // round running/crashed, no bet → let the player pre-bet the next round
    cls += ' place';
    big = 'BET NEXT ROUND';
    sub = `${euro(amount)} · GET READY`;
    onClick = () => setPending(true);
    if (amount > balance) disabled = true;
  }

  if (!hero) cls += ' compact';

  // Amount editing is locked only while a live bet is in play.
  const controlsDisabled = holding;

  return (
    <div>
      <button className={cls} onClick={onClick} disabled={disabled}>
        <span className="big">
          {big}
          {phase === 'running' && holding && (
            <> <span ref={valueRef}>{euro(bet!.amount * (state?.multiplier ?? 1))}</span></>
          )}
        </span>
        {sub && <span className="sub">{sub}</span>}
      </button>

      <div className="bet" style={{ opacity: controlsDisabled ? 0.45 : 1 }}>
        <div className="bet-amt">
          <button className="step" onClick={() => step(-1)} disabled={controlsDisabled}>−</button>
          <div className="val">{euro(amount)}</div>
          <button className="step" onClick={() => step(1)} disabled={controlsDisabled}>+</button>
        </div>
        {hero && (
          <div className="chips">
            {QUICK_CHIPS.map((c) => (
              <button
                key={c}
                className={amount === c ? 'on' : ''}
                onClick={() => setAmount(c)}
                disabled={controlsDisabled}
              >
                €{c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
