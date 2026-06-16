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
  const sceneRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const loseSeededRef = useRef(false); // crash clip start-point chosen once per crash

  // DEEP DIVE twist: read the multiplier as ocean depth.
  const depthMeter = !!theme.ui?.depthMeter;
  const metersPerX = theme.ui?.metersPerX ?? 33;
  const depthOf = (m: number) => Math.max(0, Math.round((m - 1) * metersPerX));

  const [phase, setPhase] = useState('betting');
  const [warn, setWarn] = useState(false);
  // the idle clip plays once then holds its last frame; after a beat we drift it
  // (slow zoom) so long rounds don't look like a frozen still.
  const [idleHeld, setIdleHeld] = useState(false);
  // a sound result scene (e.g. split) stays locked on screen until its clip
  // finishes, so the full spoken line is heard past the short crash window.
  const [lockedScene, setLockedScene] = useState<string | null>(null);

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
      const amount = baseStake * m;            // gross value of the position (for "YOU MISSED")
      const winAmount = baseStake * (m - 1);   // the WINNINGS (profit) — stake excluded

      if (amountRef.current) amountRef.current.textContent = euro(winAmount);
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
        // fire the countdown clip so it ends right at zero (themeable lead time;
        // 4.6s bomb-clock by default, shorter for LIFTOFF's launch countdown)
        if (!tickFired && remaining <= (theme.ui?.tickLeadMs ?? 4600) && remaining > 0) {
          getAudio().tick(theme.ui?.tickLeadMs ?? 4600);
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

  // ---- cinematic scenes ---------------------------------------------------
  // A theme can supply a video per phase (idle / lose / win). We mount ALL of a
  // game's scene videos at once and keep them WARMED (buffered + first frame
  // decoded), so a phase change starts the right clip instantly — no poster, no
  // buffer. Themes without videos fall back to the still images.
  const SCENE_KEYS = ['idle', 'lose', 'win', 'split'] as const;
  type SceneKey = (typeof SCENE_KEYS)[number];
  const sceneVideoFor = (k: SceneKey) =>
    k === 'win' ? theme.assets.sceneWinVideo
    : k === 'lose' ? theme.assets.sceneLoseVideo
    : k === 'split' ? theme.assets.sceneSplitVideo
    : theme.assets.sceneIdleVideo;
  const sceneClassFor = (k: SceneKey) =>
    k === 'win' ? 'is-caught' : k === 'lose' ? 'is-heist' : k === 'split' ? 'is-split' : '';

  // Outcome of YOUR bets. While any bet is still live (holding) we keep showing
  // the vault — the result scene only resolves once every bet of yours is
  // settled, so cashing 1 of 2 doesn't pop the win clip early:
  //   all cashed         → win
  //   one cashed + lost  → split (the "in-between")
  //   all lost           → lose
  const crashed = phase === 'crashed';
  const wonCount = (bets[0]?.cashedOut ? 1 : 0) + (bets[1]?.cashedOut ? 1 : 0);
  const placedOpen = (bets[0] && !bets[0].cashedOut ? 1 : 0) + (bets[1] && !bets[1].cashedOut ? 1 : 0);
  const holdingCount = crashed ? 0 : placedOpen; // open bets are "holding" until the bust
  const lostCount = crashed ? placedOpen : 0;    // then they're lost

  let activeScene: SceneKey;
  if (holdingCount > 0) activeScene = 'idle';                  // still in play → keep the vault
  else if (wonCount > 0 && lostCount > 0) activeScene = 'split';
  else if (wonCount > 0) activeScene = 'win';
  else if (lostCount > 0 || crashed) activeScene = 'lose';
  else activeScene = 'idle';

  // the effective on-screen scene: a locked (still-playing) sound clip wins,
  // otherwise the phase-based result above.
  const soundScenes = theme.ui?.sceneSound ?? []; // scenes that play with their own audio
  const lockedKey = lockedScene as SceneKey | null;
  const scene: SceneKey = lockedKey && sceneVideoFor(lockedKey) ? lockedKey : activeScene;

  const sceneClass = sceneClassFor(scene);
  const sceneImg =
    scene === 'win' || scene === 'split' ? theme.assets.sceneWin
    : scene === 'lose' ? theme.assets.sceneLose
    : theme.assets.sceneIdle;
  const hasSceneVideos = SCENE_KEYS.some((k) => sceneVideoFor(k));

  const pullback = !!theme.ui?.idlePullback;            // BANKHEIST: hold + slow zoom-out
  const syncCountdown = !!theme.ui?.idleSyncCountdown;  // LIFTOFF: idle plays through the countdown
  // The idle clip either holds on frame 0 through the betting countdown, or (for
  // a countdown-synced launch) plays right through it; result scenes play at once.
  const idleHoldsBetting = scene === 'idle' && phase === 'betting' && !syncCountdown;
  const activePlaying = !!sceneVideoFor(scene) && !idleHoldsBetting;

  // some clips ship with black pillarbox margins baked in — zoom to fill (per
  // scene or one value for all).
  const zoomCfg = theme.ui?.sceneZoom;
  const zoomFor = (k: SceneKey): number => (typeof zoomCfg === 'number' ? zoomCfg : zoomCfg?.[k] ?? 1);
  const styleFor = (k: SceneKey) => (zoomFor(k) !== 1 ? { transform: `scale(${zoomFor(k)})` } : undefined);
  const sceneSpeed = theme.ui?.sceneSpeed ?? 1;
  const idleSpeed = theme.ui?.idleSpeed ?? sceneSpeed;
  const idleTailLoop = theme.ui?.idleTailLoop ?? 0;
  const sceneLoop = theme.ui?.sceneLoop ?? true;
  const activeHasSound = soundScenes.includes(scene);
  // lock a sound result scene on as soon as it appears, so it plays out fully
  const lockable = activeScene !== 'idle' && soundScenes.includes(activeScene);

  // Warm every scene video once (briefly play muted, then pause to frame 0) so
  // even iOS — which won't buffer paused videos — has them ready to start
  // instantly. Runs after mount; Vault only mounts once the PLAY tap has
  // unlocked playback, and the clips are muted, so this is allowed.
  const warmedRef = useRef(false);
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    SCENE_KEYS.forEach((k) => {
      const v = sceneRefs.current[k];
      if (!v) return;
      v.muted = true;
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { v.pause(); try { v.currentTime = 0; } catch {} }).catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play the active clip (or hold it on frame 0); keep the rest paused at 0 and
  // ready. Because they're warmed, switching scenes starts instantly.
  useEffect(() => {
    if (scene !== 'lose') loseSeededRef.current = false; // re-seed each new crash
    SCENE_KEYS.forEach((k) => {
      const v = sceneRefs.current[k];
      if (!v) return;
      if (k === scene) {
        if (k === 'idle' && idleHeld) return; // the drift effect drives this clip
        // crash clip: alternate which part you see — the escape (start) or the
        // money-counting (the end) — by seeding the start point once per crash
        if (k === 'lose' && !loseSeededRef.current) {
          loseSeededRef.current = true;
          const dur = isFinite(v.duration) ? v.duration : 0;
          try { v.currentTime = dur > 4 && Math.random() < 0.5 ? Math.max(0, dur - 2.6) : 0; } catch {}
        }
        // scenes with their own audio play at normal speed so the sound isn't
        // pitched; a countdown-synced idle's rate is ramped by the effect below
        if (!(k === 'idle' && syncCountdown)) {
          v.playbackRate = activeHasSound ? 1 : k === 'idle' ? idleSpeed : sceneSpeed;
        }
        if (activePlaying) v.play().catch(() => {});
        else { v.pause(); try { v.currentTime = 0; } catch {} }
      } else if (!v.paused || v.currentTime !== 0) {
        v.pause();
        try { v.currentTime = 0; } catch {}
      }
    });
  }, [scene, activePlaying, sceneSpeed, idleSpeed, syncCountdown, activeHasSound, idleHeld]);

  // Countdown-synced idle: hold the slow ignition rate through betting, then
  // SMOOTHLY ramp up to flight speed when the round starts (no abrupt jump).
  useEffect(() => {
    if (!syncCountdown) return;
    const v = sceneRefs.current['idle'];
    if (!v) return;
    const slow = theme.ui?.idleSpeedBetting ?? idleSpeed;
    if (phase !== 'running') { v.playbackRate = slow; return; }
    const from = v.playbackRate || slow;
    const to = idleSpeed;
    const dur = 1600; // ms ramp
    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = t * t * (3 - 2 * t); // smoothstep
      v.playbackRate = from + (to - from) * e;
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, syncCountdown, idleSpeed, theme.ui?.idleSpeedBetting]);


  // lock a sound result scene on as soon as it appears (released on its 'ended')
  useEffect(() => { if (lockable) setLockedScene(activeScene); }, [lockable, activeScene]);
  // safety: release the lock after the clip's own duration (+buffer) in case the
  // 'ended' event is missed — so it always plays out fully but never sticks.
  useEffect(() => {
    if (!lockedScene) return;
    const v = sceneRefs.current[lockedScene];
    const ms = v && isFinite(v.duration) && v.duration > 0 ? v.duration * 1000 + 1500 : 15000;
    const t = setTimeout(() => setLockedScene(null), ms);
    return () => clearTimeout(t);
  }, [lockedScene]);

  // reset the "held last frame" drift whenever we leave the live idle scene
  useEffect(() => {
    if (!(scene === 'idle' && phase === 'running')) setIdleHeld(false);
  }, [scene, phase]);

  return (
    <div className="vault" ref={vaultRef}>
      {/* scene render: caught (you secured) / heist (robbed) / vault (normal).
          When the theme ships cinematic scene videos we loop those instead of
          the static stills (e.g. LIFTOFF X). */}
      <div className="vault-scene">
        {/* base still — shown for any phase that has no scene video */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`scene-still ${sceneClass}`} src={sceneImg} alt={theme.name} draggable={false} />
        {/* all of the theme's scene videos, preloaded + warmed; the active one
            is visible and playing, the rest hidden and paused at frame 0, so a
            phase change starts instantly with no buffer and no poster */}
        {hasSceneVideos &&
          SCENE_KEYS.map((k) => {
            const src = sceneVideoFor(k);
            if (!src) return null;
            return (
              <video
                key={k}
                ref={(el) => { sceneRefs.current[k] = el; }}
                className={`scene-video ${sceneClassFor(k)}${k === 'idle' && pullback ? ' idle-clip' : ''}${k === scene ? ' active' : ''}${k === 'idle' && idleHeld && pullback ? ' held' : ''}`}
                src={src}
                style={styleFor(k)}
                loop={sceneLoop}
                muted={!(soundScenes.includes(k) && k === scene)}
                playsInline
                preload="auto"
                onEnded={(e) => {
                  if (k === 'idle') {
                    if (idleTailLoop > 0 && isFinite(e.currentTarget.duration)) {
                      // keep flying: loop just the tail instead of holding the last frame
                      try { e.currentTarget.currentTime = Math.max(0, e.currentTarget.duration - idleTailLoop); } catch {}
                      e.currentTarget.play().catch(() => {});
                    } else {
                      setIdleHeld(true);
                    }
                  }
                  if (k === lockedScene) setLockedScene(null); // release the lock when it finishes
                }}
              />
            );
          })}
      </div>
      {/* ambient themed particles — only over the live/idle scene, never on a
          result scene (win / split / crash) */}
      {scene === 'idle' && <SceneMotion />}
      {/* loot that piles up with the multiplier (themed) */}
      {scene === 'idle' && <StackGrowth />}

      {/* money glow only during the live round — never over the result scenes */}
      {scene === 'idle' && <div className="vault-glow" ref={glowRef} />}

      {/* center readout — also shown after you secure, so you see the climbing
          amount + what you're missing while the round finishes */}
      {phase !== 'crashed' && !lockedScene && (
        <div className="vault-readout">
          <div className="label">{activeStake > 0 ? theme.copy.currentAmount : theme.copy.wouldBeWorth}</div>
          <div className="amount" ref={amountRef}>€0.00</div>
          <div className="missed" ref={missedRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* live DEPTH readout (DEEP DIVE only), shown while descending */}
      {depthMeter && phase === 'running' && (
        <div className="vault-depth"><span>DEPTH</span><b ref={depthRef}>0m</b></div>
      )}

      {/* ladder — only over the live vault (idle), never on a result scene */}
      {scene === 'idle' && phase !== 'crashed' && (
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

      {/* a locked result clip (e.g. split) can be tapped to skip ahead */}
      {lockedScene && (
        <button className="scene-skip" onClick={() => setLockedScene(null)} aria-label="Continue">
          <span className="scene-skip-hint">TAP TO CONTINUE</span>
        </button>
      )}

      {/* countdown only on the live vault while betting — never over a result
          scene (e.g. a split clip still playing into the next round) */}
      {scene === 'idle' && phase === 'betting' && (
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
