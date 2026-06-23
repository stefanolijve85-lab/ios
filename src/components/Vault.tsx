'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';
import { getAudio } from '@/lib/audio';
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
  const markerRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const rungRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sceneRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const idleLoopRef = useRef<HTMLVideoElement | null>(null); // dedicated seamless idle loop clip
  const countdownRef = useRef<HTMLVideoElement | null>(null); // dedicated betting-countdown clip
  const idleAudioRef = useRef<HTMLAudioElement>(null); // decoupled idle audio (normal speed)
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
  const lockedSceneRef = useRef<string | null>(null);
  lockedSceneRef.current = lockedScene; // so the rAF loop can see the lock
  // when a dedicated seamless loop clip exists, the main idle clip plays once
  // then hard-cuts to the loop (native loop, no seek). True once that handoff
  // has happened this round.
  const [idleLoopActive, setIdleLoopActive] = useState(false);
  const [idleLoopEnded, setIdleLoopEnded] = useState(false); // loop clip finished → drift-zoom its last frame

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
    let lastPhase = '', lastWarn = false, tickFired = false, cdStarted = false;
    const cdSound = !!theme.ui?.countdownSound; // countdown clip carries its own audio
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
        // fire the game's tick clock so it ends right at zero (themeable lead
        // time; 4.6s bomb-clock by default). A train has no spoken countdown but
        // we still want the ticking clock, so it plays alongside the clip audio.
        if (!tickFired && remaining <= (theme.ui?.tickLeadMs ?? 4600) && remaining > 0) {
          // a locked result clip (e.g. the half-win) owns this moment — skip the
          // next round's tick so it doesn't bleed over the scene (and never fire
          // it late, which would run past zero)
          if (!lockedSceneRef.current) getAudio().tick(theme.ui?.tickLeadMs ?? 4600, theme.ui?.tickOffset);
          tickFired = true;
        }
        // end-align the countdown clip (clock + "all aboard") so its climax lands
        // exactly at zero: start it `clipDuration` before the round begins
        if (cdSound && !cdStarted && remaining > 0) {
          const cv = countdownRef.current;
          const dur = cv && isFinite(cv.duration) ? cv.duration : 0;
          if (cv && dur > 0 && remaining <= dur * 1000 + 80) {
            cv.muted = false; // un-mute (warming forced it muted; React's attr is unreliable)
            try { cv.currentTime = 0; } catch { /* not ready */ }
            cv.play().catch(() => {});
            cdStarted = true;
          }
        }
      } else {
        tickFired = false;
        cdStarted = false;
      }
      if (timeRef.current) timeRef.current.textContent = text;
      if (w !== lastWarn) { setWarn(w); lastWarn = w; }

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
  const countdownSrc = theme.assets.sceneCountdownVideo; // TRAINRIDE: own clip during betting
  // The idle clip either holds on frame 0 through the betting countdown, or (for
  // a countdown-synced launch) plays right through it; result scenes play at once.
  // A dedicated countdown clip also makes the idle clip hold (it plays at round
  // start as the departure).
  const idleHoldsBetting = scene === 'idle' && phase === 'betting' && (!syncCountdown || !!countdownSrc);
  const activePlaying = !!sceneVideoFor(scene) && !idleHoldsBetting;
  const countdownPlaying = !!countdownSrc && scene === 'idle' && phase === 'betting';
  const countdownSound = !!theme.ui?.countdownSound; // countdown clip plays its own audio (clock + "all aboard")

  // some clips ship with black pillarbox margins baked in — zoom to fill (per
  // scene or one value for all).
  const zoomCfg = theme.ui?.sceneZoom;
  const zoomFor = (k: SceneKey): number => (typeof zoomCfg === 'number' ? zoomCfg : zoomCfg?.[k] ?? 1);
  const styleFor = (k: SceneKey) => (zoomFor(k) !== 1 ? { transform: `scale(${zoomFor(k)})` } : undefined);
  // playback rate for scene videos — one value for all, or per scene (<1 = slo-mo)
  const speedCfg = theme.ui?.sceneSpeed;
  const sceneSpeedFor = (k: SceneKey): number => (typeof speedCfg === 'number' ? speedCfg : speedCfg?.[k] ?? 1);
  const idleSpeed = theme.ui?.idleSpeed ?? sceneSpeedFor('idle');
  const idleLoopSrc = theme.assets.sceneIdleLoopVideo; // dedicated seamless loop clip (preferred over tail-loop)
  const idleEndZoom = !!theme.ui?.idleEndZoom; // loop clip plays once, then a slow zoom on the held last frame
  const idleLoopStartSec = theme.ui?.idleLoopStartSec ?? 0; // skip the loop clip's first bit to align the seam
  const idleTailLoop = idleLoopSrc ? 0 : (theme.ui?.idleTailLoop ?? 0);
  const idleAudioNormal = !!theme.ui?.idleAudioNormal; // play the idle clip's audio at normal speed, decoupled from the slow-mo video
  const idleFadeIn = !!theme.ui?.idleFadeIn; // linger on the station poster, then gently fade the clip in
  const sceneLoop = theme.ui?.sceneLoop ?? true;
  const activeHasSound = soundScenes.includes(scene);
  const idleHasSound = soundScenes.includes('idle'); // the idle clip + its loop clip play their own audio
  const sceneVoiceCfg = theme.ui?.sceneVoice; // a timed spoken line over a (muted) result clip
  // lock a result scene on as soon as it appears, so it plays out fully — either
  // because it carries its own audio, or because it has a timed scene-voice
  const lockable = activeScene !== 'idle' &&
    (soundScenes.includes(activeScene) || sceneVoiceCfg?.on === activeScene);

  // Warm every scene video once (briefly play muted, then pause to frame 0) so
  // even iOS — which won't buffer paused videos — has them ready to start
  // instantly. Runs after mount; Vault only mounts once the PLAY tap has
  // unlocked playback, and the clips are muted, so this is allowed.
  const warmedRef = useRef(false);
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    let cancelled = false;
    // Warm the result clips ONE AT A TIME (iOS throttles concurrent video play),
    // so each buffers + decodes its first frame and starts instantly later. The
    // active (idle) clip is left to the play/pause effect.
    (async () => {
      for (const k of SCENE_KEYS) {
        if (cancelled) continue;
        // skip the active clip (the play/pause effect drives it) — UNLESS it's
        // the idle clip held behind a countdown clip, which never plays during
        // betting and so still needs warming for an instant departure.
        if (k === activeScene && !(k === 'idle' && countdownSrc)) continue;
        const v = sceneRefs.current[k];
        if (!v) continue;
        v.muted = true;
        try {
          await v.play();
          if (!cancelled) { v.pause(); v.currentTime = 0; }
        } catch { /* skip */ }
      }
      // warm the dedicated idle loop + countdown clips too (instant hand-offs);
      // hold the loop clip ON its hand-off frame (idleLoopStartSec) so that frame
      // is already decoded and the cut doesn't have to seek-and-decode live
      for (const ref of [idleLoopRef, countdownRef]) {
        const v = ref.current;
        if (!v || cancelled) continue;
        v.muted = true;
        try { await v.play(); if (!cancelled) { v.pause(); v.currentTime = ref === idleLoopRef ? idleLoopStartSec : 0; } } catch { /* skip */ }
      }
      // idleSyncCountdown games play the idle clip THROUGH the countdown, so it
      // must autostart on open. The result-clip warming above already unlocked
      // muted playback; kick the idle here (in the same post-tap context) and
      // leave it running, so it plays without waiting for a button press.
      if (syncCountdown && !cancelled) {
        const iv = sceneRefs.current['idle'];
        if (iv) { iv.muted = true; iv.play().catch(() => {}); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iOS drops the decode buffer of long-paused clips, so a clip warmed only at
  // mount is cold by the time the round resolves (the win clip especially —
  // ~12MB). Re-warm the result clips at the start of EACH betting phase (calm
  // moment) so they're hot and start instantly when the round ends.
  // NOT for idleSyncCountdown games: their idle clip is PLAYING through betting,
  // and starting another clip pauses it on iOS (which would freeze the scene).
  useEffect(() => {
    if (phase !== 'betting' || syncCountdown) return;
    let cancelled = false;
    (async () => {
      for (const k of ['win', 'lose', 'split'] as SceneKey[]) {
        if (cancelled || k === scene || !sceneVideoFor(k)) continue;
        const v = sceneRefs.current[k];
        if (!v) continue;
        v.muted = true;
        try { await v.play(); if (!cancelled) { v.pause(); v.currentTime = 0; } } catch { /* skip */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  useEffect(() => {
    if (scene !== 'lose') loseSeededRef.current = false; // re-seed each new crash
    SCENE_KEYS.forEach((k) => {
      const v = sceneRefs.current[k];
      if (!v) return;
      if (k === scene) {
        if (k === 'idle' && idleHeld) return; // the drift effect drives this clip
        // crash clip start point (seeded once per crash): a fixed start offset
        // (skip the buildup, e.g. cut to the implosion sooner) when the theme sets
        // one, otherwise alternate the escape (start) or money-counting (end).
        if (k === 'lose' && !loseSeededRef.current) {
          loseSeededRef.current = true;
          const dur = isFinite(v.duration) ? v.duration : 0;
          const startSec = theme.ui?.sceneStartSec?.lose;
          try {
            v.currentTime = startSec != null
              ? Math.min(Math.max(0, startSec), Math.max(0, dur - 0.1))
              : (dur > 4 && Math.random() < 0.5 ? Math.max(0, dur - 2.6) : 0);
          } catch {}
        }
        // scenes with their own audio play at normal speed so the sound isn't
        // pitched; a countdown-synced idle's rate is ramped by the effect below
        if (!(k === 'idle' && syncCountdown)) {
          v.playbackRate = activeHasSound ? 1 : k === 'idle' ? idleSpeed : sceneSpeedFor(k);
        }
        if (activePlaying) {
          // iOS blocks UN-muted programmatic play() without a user gesture, so
          // always start muted (guaranteed to play — never a frozen frame), then
          // un-mute scenes that carry their own audio (already unlocked by the
          // PLAY tap). Fixes the split clip freezing on iOS.
          const wantSound = activeHasSound;
          v.muted = true;
          v.play().then(() => { if (wantSound) v.muted = false; }).catch(() => {});
        } else { v.pause(); try { v.currentTime = 0; } catch {} }
      } else if (!v.paused || v.currentTime !== 0) {
        v.pause();
        try { v.currentTime = 0; } catch {}
      }
    });
  }, [scene, activePlaying, speedCfg, idleSpeed, syncCountdown, activeHasSound, idleHeld]);

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

  // Seamless tail-loop: jump back to the loop start at the EXACT last frame
  // (frame-accurate via requestVideoFrameCallback) so the matching frames line
  // up and the seam is invisible — the train just keeps racing.
  useEffect(() => {
    if (idleTailLoop <= 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = sceneRefs.current['idle'] as any;
    if (!v) return;
    let id = 0;
    let cancelled = false;
    const seekBack = (t: number) => {
      const d = v.duration;
      if (d && isFinite(d) && !v.paused && t >= d - 0.045) {
        try { v.currentTime = Math.max(0, d - idleTailLoop); } catch { /* not seekable */ }
      }
    };
    if (typeof v.requestVideoFrameCallback === 'function') {
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        seekBack(meta?.mediaTime ?? v.currentTime);
        if (!cancelled) id = v.requestVideoFrameCallback(onFrame);
      };
      id = v.requestVideoFrameCallback(onFrame);
      return () => { cancelled = true; if (v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(id); };
    }
    const onRaf = () => { seekBack(v.currentTime); if (!cancelled) id = requestAnimationFrame(onRaf); };
    id = requestAnimationFrame(onRaf);
    return () => { cancelled = true; cancelAnimationFrame(id); };
  }, [idleTailLoop]);

  // Decoupled idle audio: play the idle clip's own track at NORMAL speed
  // (separate from the slow-mo video) so the steam/horn aren't time-stretched.
  // Tracks the idle VIDEO: it starts from 0 whenever the idle clip actually
  // begins playing (through the countdown, or — with a dedicated countdown clip
  // — at the departure on round start) and stops once it hands off to the loop.
  useEffect(() => {
    if (!idleAudioNormal) return;
    const a = idleAudioRef.current;
    if (!a) return;
    const idleVideoPlaying = scene === 'idle' && activePlaying && !idleLoopActive;
    if (idleVideoPlaying) {
      a.playbackRate = 1;
      if (a.paused) { try { a.currentTime = 0; } catch { /* not ready */ } a.play().catch(() => {}); }
    } else if (!a.paused) {
      a.pause();
    }
  }, [scene, activePlaying, idleLoopActive, idleAudioNormal]);

  // Dedicated countdown clip. Two modes:
  //  - ambient (muted): native-loop it through the whole betting countdown.
  //  - own audio (countdownSound): hold frame 0; the rAF loop starts it
  //    end-aligned so its clock + "all aboard" climax lands at zero.
  // Reset to frame 0 when betting BEGINS (show the waiting-station frame), but on
  // round start just pause and HOLD the last frame so it doesn't jump to frame 0
  // mid-fade as the departure clip takes over.
  useEffect(() => {
    const cv = countdownRef.current;
    if (!cv) return;
    if (countdownPlaying) {
      try { cv.currentTime = 0; } catch { /* not ready */ }
      if (!countdownSound) cv.play().catch(() => {}); // ambient loops now; sound-mode end-aligns later
    } else {
      cv.pause();
    }
  }, [countdownPlaying, countdownSound]);

  // Dedicated idle loop clip: play it natively-looped once it's active, else
  // keep it paused at frame 0. Reset the hand-off whenever we leave the idle
  // scene, so each round starts again from the main (departure) clip.
  useEffect(() => {
    const lv = idleLoopRef.current;
    if (!lv) return;
    if (scene === 'idle' && idleLoopActive) {
      lv.playbackRate = idleSpeed;
      // start muted (iOS-safe), then un-mute if the dive carries its own audio
      lv.muted = true;
      lv.play().then(() => { if (idleHasSound) lv.muted = false; }).catch(() => {});
    } else {
      lv.pause();
      // hold on the hand-off frame (pre-decoded) so the next cut starts cleanly
      try { lv.currentTime = idleLoopStartSec; } catch { /* not ready */ }
    }
  }, [scene, idleLoopActive, idleSpeed, idleHasSound]);
  useEffect(() => { if (scene !== 'idle') { setIdleLoopActive(false); setIdleLoopEnded(false); } }, [scene]);

  // lock a sound result scene on as soon as it appears (released on its 'ended')
  useEffect(() => { if (lockable) setLockedScene(activeScene); }, [lockable, activeScene]);

  // fire the timed scene-voice when its scene appears (e.g. the "case on deck"
  // line over the muted split clip); reset when we leave that scene
  const sceneVoiceFiredRef = useRef(false);
  useEffect(() => {
    if (sceneVoiceCfg && scene === sceneVoiceCfg.on) {
      if (!sceneVoiceFiredRef.current) {
        sceneVoiceFiredRef.current = true;
        getAudio().sceneVoice(sceneVoiceCfg.delayMs ?? 0, sceneVoiceCfg.gain ?? 1);
      }
    } else {
      sceneVoiceFiredRef.current = false;
    }
  }, [scene, sceneVoiceCfg]);
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
                className={`scene-video ${sceneClassFor(k)}${k === 'idle' && pullback ? ' idle-clip' : ''}${k === 'idle' && idleFadeIn ? ' idle-fade' : ''}${k === scene && !(k === 'idle' && (idleLoopActive || countdownPlaying)) ? ' active' : ''}${k === 'idle' && idleHeld && pullback ? ' held' : ''}`}
                src={src}
                style={styleFor(k)}
                loop={sceneLoop}
                muted={k === 'idle' && idleAudioNormal ? true : !(soundScenes.includes(k) && k === scene)}
                playsInline
                preload="auto"
                onEnded={(e) => {
                  if (k === 'idle') {
                    if (idleLoopSrc) {
                      // hard-cut to the dedicated seamless loop clip (its first
                      // frame matches this clip's last frame, so it's invisible)
                      const lv = idleLoopRef.current;
                      if (lv) {
                        try { lv.currentTime = idleLoopStartSec; } catch {}
                        lv.muted = true;
                        lv.play().then(() => { if (idleHasSound) lv.muted = false; }).catch(() => {});
                      }
                      setIdleLoopActive(true);
                    } else if (idleTailLoop > 0) {
                      // fallback: rVFC normally seeks back before the last frame,
                      // but if it misses, jump back into the seamless tail + resume
                      const v = e.currentTarget;
                      try { v.currentTime = Math.max(0, (v.duration || 0) - idleTailLoop); } catch {}
                      v.play().catch(() => {});
                    } else {
                      setIdleHeld(true); // non-loop idle holds the last frame
                    }
                  }
                  if (k === lockedScene) setLockedScene(null); // release the lock when it finishes
                }}
              />
            );
          })}
        {/* dedicated countdown clip (loops natively through the betting phase,
            then the idle clip plays the departure at round start) */}
        {countdownSrc && (
          <video
            ref={countdownRef}
            className={`scene-video countdown-clip${countdownPlaying ? ' active' : ''}`}
            src={countdownSrc}
            style={styleFor('idle')}
            loop={!countdownSound}
            muted={!countdownSound}
            playsInline
            preload="auto"
          />
        )}
        {/* dedicated seamless idle loop clip (hard-cut from the main idle clip
            on matching frames, then native-looped — no seek, no visible seam) */}
        {idleLoopSrc && (
          <video
            ref={idleLoopRef}
            className={`scene-video idle-loop-clip${scene === 'idle' && idleLoopActive ? ' active' : ''}${idleLoopEnded && idleEndZoom ? ' dive-hold' : ''}`}
            src={idleLoopSrc}
            style={styleFor('idle')}
            loop={!idleEndZoom}
            muted={!idleHasSound}
            playsInline
            preload="auto"
            onEnded={() => { if (idleEndZoom) setIdleLoopEnded(true); }}
          />
        )}
        {/* decoupled idle audio (normal speed) — the muted clip handles visuals */}
        {idleAudioNormal && sceneVideoFor('idle') && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio ref={idleAudioRef} src={sceneVideoFor('idle')} preload="auto" />
        )}
      </div>

      {/* center readout — also shown after you secure, so you see the climbing
          amount + what you're missing while the round finishes */}
      {phase !== 'crashed' && !lockedScene && (
        <div className={`vault-readout${depthMeter ? ' has-depth' : ''}`}>
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
