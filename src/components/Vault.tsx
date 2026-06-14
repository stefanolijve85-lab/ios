'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';
import { getAudio } from '@/lib/audio';
import { ladderTopFor, ladderRungs } from '@/lib/constants';
import { euro, clock } from '@/lib/format';

export default function Vault() {
  const { stateRef, liveMultiplier, serverNow, bets } = useGame();
  const theme = useTheme();
  const amountRef = useRef<HTMLDivElement>(null);
  const multRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const missedRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState('betting');
  const [warn, setWarn] = useState(false);

  // Dynamic ladder: rescales upward as the multiplier climbs past the top rung
  // (so the game can show far more than 23x). topRef holds the live ceiling.
  const [ladder, setLadder] = useState<number[]>(() => ladderRungs(ladderTopFor(1)));
  const topRef = useRef<number>(ladderTopFor(1));

  // Track active (still holding) vs cashed bets so the counter can keep running
  // after a stash and show what you "missed".
  const activeStake =
    (bets[0] && !bets[0]!.cashedOut ? bets[0]!.amount : 0) +
    (bets[1] && !bets[1]!.cashedOut ? bets[1]!.amount : 0);
  const cashedStake =
    (bets[0]?.cashedOut ? bets[0]!.amount : 0) +
    (bets[1]?.cashedOut ? bets[1]!.amount : 0);
  const cashedPayout =
    (bets[0]?.cashedOut ? bets[0]!.payout : 0) +
    (bets[1]?.cashedOut ? bets[1]!.payout : 0);
  const stakeRef = useRef({ active: activeStake, cashed: cashedStake, payout: cashedPayout });
  stakeRef.current = { active: activeStake, cashed: cashedStake, payout: cashedPayout };

  // You secured this round → show the "thief caught" result.
  const isSecured = cashedPayout > 0;

  useEffect(() => {
    let raf = 0;
    let lastPhase = '', lastWarn = false, tickFired = false;
    const loop = () => {
      const s = stateRef.current;
      const m = liveMultiplier();
      const st = stakeRef.current;
      // Counter keeps running on your bet (even after you stash); falls back to
      // an illustrative pot when you have no bet.
      const baseStake = st.active > 0 ? st.active : st.cashed > 0 ? st.cashed : 100;
      const amount = baseStake * m;

      if (amountRef.current) amountRef.current.textContent = euro(amount);
      if (multRef.current) multRef.current.textContent = m.toFixed(2) + 'x';

      // "YOU MISSED" — extra you'd have had if you hadn't stashed yet
      if (missedRef.current) {
        if (st.active === 0 && st.cashed > 0 && s?.phase === 'running') {
          const missed = amount - st.payout;
          missedRef.current.style.display = '';
          missedRef.current.textContent = `YOU MISSED +${euro(Math.max(0, missed))}`;
        } else {
          missedRef.current.style.display = 'none';
        }
      }

      // betting countdown (legit) + tension glow (driven by stake size, not time)
      let danger = false, text = '00:00', w = false;
      if (s?.phase === 'running') {
        danger = m >= 5; // bigger stash = redder, hotter — no timing hint
      } else if (s?.phase === 'betting') {
        const remaining = (s.phaseEndsAt ?? 0) - serverNow();
        text = clock(remaining);
        w = remaining <= 5000;
        // play the 4.6s bomb-clock so it ends right when the vault closes (0s)
        if (!tickFired && remaining <= 4600 && remaining > 0) {
          getAudio().tick();
          tickFired = true;
        }
      } else {
        tickFired = false;
      }
      if (timeRef.current) timeRef.current.textContent = text;
      if (w !== lastWarn) { setWarn(w); lastWarn = w; }

      if (glowRef.current) glowRef.current.style.opacity = String(0.3 + Math.min(0.7, (m - 1) * 0.12));

      // grow the ladder when the multiplier nears the top rung
      const desiredTop = ladderTopFor(m);
      if (desiredTop !== topRef.current) {
        topRef.current = desiredTop;
        setLadder(ladderRungs(desiredTop));
      }

      // smooth ladder indicator: log position so it lines up with the rungs
      if (markerRef.current) {
        const top = topRef.current;
        const pos = Math.max(0, Math.min(1, 1 - Math.log(Math.max(1, m)) / Math.log(top)));
        markerRef.current.style.top = (pos * 100) + '%';
      }

      if (vaultRef.current) vaultRef.current.classList.toggle('danger', danger);

      const ph = s?.phase ?? 'betting';
      if (ph !== lastPhase) {
        setPhase(ph);
        lastPhase = ph;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [liveMultiplier, serverNow, stateRef]);

  return (
    <div className="vault" ref={vaultRef}>
      {/* scene render: caught (you secured) / heist (robbed) / vault (normal) */}
      <div className="vault-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={isSecured ? 'is-caught' : phase === 'crashed' ? 'is-heist' : ''}
          src={isSecured ? theme.assets.sceneWin : phase === 'crashed' ? theme.assets.sceneLose : theme.assets.sceneIdle}
          alt={theme.name}
          draggable={false}
        />
      </div>
      {/* money glow only during the live round — never over the result scenes */}
      {!isSecured && phase !== 'crashed' && <div className="vault-glow" ref={glowRef} />}

      {/* center readout — also shown after you secure, so you see the climbing
          amount + what you're missing while the round finishes */}
      {phase !== 'crashed' && (
        <div className="vault-readout">
          <div className="label">{isSecured ? theme.copy.wouldBeWorth : theme.copy.currentAmount}</div>
          <div className="amount" ref={amountRef}>€0.00</div>
          <div className="missed" ref={missedRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* multiplier ladder (hidden only during the robbery) */}
      {phase !== 'crashed' && (
        <div className="vault-ladder">
          {ladder.map((r, i) => (
            <div key={`${i}-${r}`} className={`rung${i === 0 ? ' top' : i <= 2 ? ' hot' : ''}`}>
              {Number.isInteger(r) ? r : r.toFixed(1)}x
            </div>
          ))}
          <div className="ladder-marker" ref={markerRef} style={{ top: '100%' }} />
        </div>
      )}

      {/* countdown only while betting — during a round the crash is unpredictable */}
      {phase === 'betting' && (
        <div className={`vault-countdown${warn ? ' warn' : ''}`}>
          <div className="cd-pill">
            <span className="lbl">🔒 {theme.copy.countdownLabel}</span>
            <span className="time" ref={timeRef}>00:00</span>
          </div>
        </div>
      )}

    </div>
  );
}
