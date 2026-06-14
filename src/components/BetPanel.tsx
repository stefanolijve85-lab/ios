'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { QUICK_CHIPS, QUICK_CHIPS_BIG } from '@/lib/constants';
import { euro } from '@/lib/format';

export default function BetPanel({ slot, hero = false }: { slot: 0 | 1; hero?: boolean }) {
  const { state, bets, balance, placeBet, cancelBet, stash, liveMultiplier, setWaiting } = useGame();
  const [amount, setAmount] = useState(10);
  const [pending, setPending] = useState(false); // queued bet for the next round
  const [repeat, setRepeat] = useState(false);    // auto re-bet last stake each round
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const valueRef = useRef<HTMLSpanElement>(null);

  const phase = state?.phase ?? 'betting';
  const bet = bets[slot];
  const holding = !!bet && !bet.cashedOut && !bet.lost;
  const cashed = !!bet && bet.cashedOut;
  const controlsDisabled = holding; // amount locked only while a live bet runs

  // Auto-place when the next vault opens: a queued bet OR the repeat-last-bet.
  // Guarded to fire at most once per betting phase.
  const amountRef = useRef(amount);
  amountRef.current = amount;
  const autoDoneRef = useRef(false);
  useEffect(() => {
    if (phase !== 'betting') { autoDoneRef.current = false; return; }
    if (!bet && !autoDoneRef.current && (pending || repeat)) {
      autoDoneRef.current = true;
      if (amountRef.current <= balance) { placeBet(slot, amountRef.current); setRepeat(true); }
      setPending(false);
    }
  }, [phase, pending, repeat, bet, slot, placeBet, balance]);

  // Live potential payout on the STASH button while a round runs.
  useEffect(() => {
    if (!(phase === 'running' && holding)) return;
    let raf = 0;
    const loop = () => {
      if (valueRef.current && bet) valueRef.current.textContent = euro(bet.amount * liveMultiplier());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, holding, bet, liveMultiplier]);

  // ---- amount stepping: whole numbers, snap to round values on big jumps ----
  // surface "queued, waiting for next round" so the vault can show the spinner
  useEffect(() => {
    if (slot === 0) setWaiting(pending);
  }, [pending, slot, setWaiting]);

  const step = (d: number) =>
    setAmount((a) => {
      const mag = Math.abs(d);
      let n = a + d;
      if (mag > 1) n = Math.round(n / mag) * mag; // land on round amounts
      return Math.max(1, Math.round(n));
    });

  // hold +/- to ramp quickly (accelerates the longer you hold)
  const holdTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const beginHold = (dir: 1 | -1) => {
    if (controlsDisabled) return;
    let c = 0;
    step(dir);
    holdTimer.current = setInterval(() => {
      c++;
      const mag = c < 5 ? 1 : c < 12 ? 10 : c < 20 ? 100 : c < 30 ? 500 : 1000;
      step(dir * mag);
    }, 90);
  };
  const endHold = () => {
    if (holdTimer.current) { clearInterval(holdTimer.current); holdTimer.current = undefined; }
  };
  useEffect(() => endHold, []);

  // tap the amount to type a custom value
  const startEdit = () => {
    if (controlsDisabled) return;
    setDraft(String(amount));
    setEditing(true);
  };
  const commitEdit = () => {
    const n = parseInt(draft.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n) && n >= 1) setAmount(n);
    setEditing(false);
  };

  // ---- button content + behaviour by state -------------------------------
  let cls = 'stash-btn';
  let onClick: (() => void) | undefined;
  let disabled = false;
  let big = 'SECURE';
  let sub: string | null = 'LOCK YOUR WINNINGS';

  if (phase === 'betting') {
    if (holding) {
      cls += ' placed'; big = '✓ BET PLACED';
      sub = `TAP TO CANCEL · ${euro(bet!.amount)}`;
      onClick = () => { cancelBet(slot); setRepeat(false); };
    } else if (amount > balance) {
      cls += ' lowbal'; big = 'INSUFFICIENT BALANCE';
      sub = `Need ${euro(amount)} · You have ${euro(balance)}`;
      disabled = true;
    } else {
      cls += ' place'; big = 'PLACE BET';
      sub = `${euro(amount)} · VAULT OPEN`;
      onClick = () => { placeBet(slot, amount); setRepeat(true); };
    }
  } else if (phase === 'running' && holding) {
    big = 'SECURE'; sub = 'LOCK YOUR WINNINGS';
    onClick = () => stash(slot);
  } else if (cashed) {
    cls += ' done'; big = `BAG SECURED ${euro(bet!.payout)}`;
    sub = null; disabled = true;
  } else if (phase === 'crashed' && bet && !cashed) {
    cls += ' placed'; big = 'TOO LATE — STOLEN';
    sub = `−${euro(bet.amount)}`; disabled = true;
  } else if (pending) {
    cls += ' placed'; big = '✓ QUEUED';
    sub = `NEXT ROUND · ${euro(amount)} · TAP TO CANCEL`;
    onClick = () => setPending(false);
  } else if (amount > balance) {
    cls += ' lowbal'; big = 'INSUFFICIENT BALANCE';
    sub = `Need ${euro(amount)} · You have ${euro(balance)}`;
    disabled = true;
  } else {
    cls += ' place'; big = 'BET NEXT ROUND';
    sub = `${euro(amount)} · GET READY`;
    onClick = () => setPending(true);
  }
  if (!hero) cls += ' compact';

  return (
    <div className="betpanel">
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
        {hero && <div className="bet-amt-label">BET AMOUNT</div>}
        <div className="bet-amt">
          <button
            className="step"
            onPointerDown={(e) => { e.preventDefault(); beginHold(-1); }}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            disabled={controlsDisabled}
            aria-label="Decrease"
          >−</button>

          {editing ? (
            <input
              className="val val-edit"
              autoFocus
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
            />
          ) : (
            <button className="val" onClick={startEdit} disabled={controlsDisabled} title="Tap to type an amount">
              {euro(amount)}
            </button>
          )}

          <button
            className="step"
            onPointerDown={(e) => { e.preventDefault(); beginHold(1); }}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            disabled={controlsDisabled}
            aria-label="Increase"
          >+</button>
        </div>

        {hero && (
          <>
            <div className="chips">
              {QUICK_CHIPS.map((c) => (
                <button key={c} className={`bet-chip${amount === c ? ' selected' : ''}`} onClick={() => setAmount(c)} disabled={controlsDisabled}>
                  <span>€{c}</span>
                </button>
              ))}
            </div>
            <div className="chips">
              {QUICK_CHIPS_BIG.map((c) => (
                <button key={c} className={`bet-chip${amount === c ? ' selected' : ''}`} onClick={() => setAmount(c)} disabled={controlsDisabled}>
                  <span>€{c.toLocaleString('en-US')}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
