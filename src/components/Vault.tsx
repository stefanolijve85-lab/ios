'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';
import { getAudio } from '@/lib/audio';
import SceneMotion from './SceneMotion';
import StackGrowth from './StackGrowth';
import { euro, clock } from '@/lib/format';

// ladder: a fixed stack of rungs whose VALUES scroll up as the round climbs,
// with the marker floating near the top.
const LADDER_N = 9;
const MARKER_FRAC = 0.15; // where the marker hovers (fraction from the top)
const fmtX = (v: number) => (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : String(Math.round(v))) + 'x';

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
  const depthRef = useRef<HTMLDivElement>(null);
  const rungRefs = useRef<(HTMLDivElement | null)[]>([]);

  // DEEP DIVE twist: read the multiplier as ocean depth.
  const depthMeter = !!theme.ui?.depthMeter;
  const metersPerX = theme.ui?.metersPerX ?? 33;
  const depthOf = (m: number) => Math.max(0, Math.round((m - 1) * metersPerX));

  const [phase, setPhase] = useState('betting');
  const [warn, setWarn] = useState(false);

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
      if (depthRef.current) depthRef.current.textContent = depthOf(m).toLocaleString('en-US') + 'm';

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

      // floating-marker ladder: the whole scale follows the multiplier so every
      // number scrolls up while the marker stays fixed near the top.
      {
        const running = s?.phase === 'running';
        const scaleM = running ? Math.max(m, 1.5) : 12; // static teaser while betting
        const topVal = Math.pow(scaleM, 1 / (1 - MARKER_FRAC));
        const lnTop = Math.log(topVal);
        for (let i = 0; i < LADDER_N; i++) {
          const el = rungRefs.current[i];
          if (!el) continue;
          const v = Math.pow(topVal, 1 - i / (LADDER_N - 1)); // i=0 → top, last → 1
          el.textContent = depthMeter ? depthOf(v).toLocaleString('en-US') + 'm' : fmtX(v);
        }
        if (markerRef.current) {
          const pos = running
            ? Math.max(0, Math.min(1, 1 - Math.log(Math.max(1, m)) / lnTop))
            : 1; // rests at the bottom (1x) while betting
          markerRef.current.style.top = (pos * 100) + '%';
        }
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

  // pick the scene for the current phase, preferring a cinematic video if the
  // theme provides one (still image otherwise).
  const sceneClass = isSecured ? 'is-caught' : phase === 'crashed' ? 'is-heist' : '';
  const sceneImg = isSecured
    ? theme.assets.sceneWin
    : phase === 'crashed'
    ? theme.assets.sceneLose
    : theme.assets.sceneIdle;
  const sceneVideo = isSecured
    ? theme.assets.sceneWinVideo
    : phase === 'crashed'
    ? theme.assets.sceneLoseVideo
    : theme.assets.sceneIdleVideo;
  // some scene clips ship with black pillarbox margins baked in — zoom so the
  // picture fills the whole scene box edge to edge (themeable, default none).
  const sceneZoom = theme.ui?.sceneZoom ?? 1;
  const sceneStyle = sceneZoom !== 1 ? { transform: `scale(${sceneZoom})` } : undefined;
  const sceneSpeed = theme.ui?.sceneSpeed ?? 1;
  // poster shown instantly while the scene video buffers (its first frame, for a
  // seamless start) — the video crossfades in over it. Falls back to nothing
  // (dark scene background) when not provided.
  const scenePoster = isSecured
    ? theme.assets.scenePosters?.win
    : phase === 'crashed'
    ? theme.assets.scenePosters?.lose
    : theme.assets.scenePosters?.idle;

  return (
    <div className="vault" ref={vaultRef}>
      {/* scene render: caught (you secured) / heist (robbed) / vault (normal).
          When the theme ships cinematic scene videos we loop those instead of
          the static stills (e.g. LIFTOFF X). */}
      <div className="vault-scene">
        {sceneVideo ? (
          <>
            {/* poster (the video's first frame) shows instantly so the start is
                seamless; the video crossfades in over it once it can play */}
            {scenePoster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={`scene-poster ${sceneClass}`}
                src={scenePoster}
                style={sceneStyle}
                alt=""
                draggable={false}
              />
            )}
            <video
              key={sceneVideo}
              className={`scene-video ${sceneClass}`}
              src={sceneVideo}
              poster={scenePoster}
              style={sceneStyle}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.playbackRate = sceneSpeed;
                e.currentTarget.play().catch(() => {});
                e.currentTarget.classList.add('ready');
              }}
            />
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={sceneClass}
            src={sceneImg}
            alt={theme.name}
            draggable={false}
          />
        )}
      </div>
      {/* ambient themed particles — only over the live/idle scene, never on the
          crash or secure result art */}
      {!isSecured && phase !== 'crashed' && <SceneMotion />}
      {/* loot that piles up with the multiplier (themed) */}
      {!isSecured && phase !== 'crashed' && <StackGrowth />}

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

      {/* live DEPTH readout (DEEP DIVE only), shown while descending */}
      {depthMeter && phase === 'running' && (
        <div className="vault-depth"><span>DEPTH</span><b ref={depthRef}>0m</b></div>
      )}

      {/* ladder — fixed rungs whose values scroll up; marker floats near the top
          (labelled as depth for DEEP DIVE; hidden on crash) */}
      {phase !== 'crashed' && (
        <div className={`vault-ladder${depthMeter ? ' depth' : ''}`}>
          {Array.from({ length: LADDER_N }).map((_, i) => (
            <div
              key={i}
              ref={(el) => { rungRefs.current[i] = el; }}
              className={`rung${i === 0 ? ' top' : i <= 2 ? ' hot' : ''}`}
            />
          ))}
          <div className="ladder-marker" ref={markerRef} style={{ top: '15%' }} />
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
