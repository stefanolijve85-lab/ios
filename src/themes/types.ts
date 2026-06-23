// A "theme" is the *presentation* skin for one Olive Games crash title.
// It contains ONLY art, copy, colour and audio — never any game logic, math
// or fairness. Those live in the shared engine and are identical for every
// game (one transparent RTP, one provably-fair RNG). A theme can therefore
// never change the odds.

export interface ThemeColors {
  green: string;        // primary gradient middle
  greenHi: string;      // primary CTA / selected / text
  greenLime: string;    // highlight
  greenGlow: string;    // glow
  greenDeep: string;    // dark gradient bottom
  greenMuted: string;   // labels / secondary
  // RGB triplets (e.g. "47,208,230") driving the themeable accent in globals.css
  accentRgb: string;    // bright neon accent (glows/borders/marker/chips)
  btnTopRgb: string;    // CTA button gradient top (dark)
  btnBotRgb: string;    // CTA button gradient bottom (darker)
  ambientRgb: string;   // the game's signature tone (wait box, spinner, ambient)
}

export interface ThemeAssets {
  logo: string;
  landing: string;
  landingVideo?: string; // optional cinematic for the start screen (overlay logo + PLAY)
  playButton?: string;   // optional designed PLAY button image (overlaid on the video)
  sceneIdle: string;    // the "vault" / idle scene while betting + running
  sceneLose: string;    // the crash / robbery scene
  sceneWin: string;     // the secure / caught scene
  // Optional cinematic (animated) scenes — when present the engine plays these
  // looping videos instead of the static stills above for the matching phase.
  sceneIdleVideo?: string;  // idle / running
  // Optional dedicated clip shown DURING the betting countdown (loops natively),
  // e.g. the train waiting at the station. At round start the engine switches to
  // sceneIdleVideo (the departure). Lets the idle clip be a crisp normal-speed
  // departure instead of a slowed-down buildup.
  sceneCountdownVideo?: string;
  // Optional dedicated seamless LOOP clip for the idle scene: after the main
  // idle clip plays once (e.g. the train's departure) the engine hard-cuts to
  // this clip and loops it natively (no seek), so the loop point is invisible.
  // Author it so its FIRST frame == the idle clip's LAST frame, and its first
  // frame == its own last frame. When present it replaces idleTailLoop.
  sceneIdleLoopVideo?: string;
  sceneLoseVideo?: string;  // crash (all bets lost)
  sceneWinVideo?: string;   // secured (all bets cashed)
  sceneSplitVideo?: string; // mixed result: one bet won AND one bet lost
  // Optional poster stills shown instantly while a scene video buffers, with the
  // video fading in over them. Use the video's FIRST FRAME for a seamless start.
  scenePosters?: { idle?: string; lose?: string; win?: string };
  icons: {
    home: string;
    history: string;
    vault: string;
    leaderboard: string;
    chat: string;
  };
}

export interface ThemeAudio {
  motifLow: string;
  motifHigh: string;
  stash: string;
  crash: string;
  crashAlt?: string; // optional 2nd crash/alarm clip — alternated with `crash`
  launch?: string;   // optional callout played when the round starts (e.g. "LIFTOFF!")
  sceneVoice?: string; // optional spoken line played during a result scene (see ui.sceneVoice)
  lobby: string;
  tick: string;
  voiceCrash: string[]; // random "loss" lines
  voiceWin: string[];   // random "win" lines
}

export interface ThemeCopy {
  // cash-out action
  cashOut: string;        // BANKHEIST: "SECURE"
  cashOutSub: string;     // "LOCK YOUR WINNINGS"
  securedVerb: string;    // past tense for the activity feed: "secured"
  bagSecured: (amount: string) => string; // "BAG SECURED €X"
  // result scene labels
  crashedTile: string;    // "TOO LATE — STOLEN"
  currentAmount: string;  // "CURRENT AMOUNT"
  wouldBeWorth: string;   // "WOULD BE WORTH"
  countdownLabel: string; // "VAULT CLOSES IN"
  betOpen?: string;       // optional tag after the stake on the PLACE BET button (BANKHEIST: "VAULT OPEN")
  waitForNext: string;    // start-screen wait box: "WAITING FOR THE NEXT VAULT"
  // flash banners
  winFlash: string;       // "YOU GOT OUT!"
  loseFlash: string;      // "THEY GOT AWAY!"
  landingAlt: string;
}

// Optional per-theme UI variants (bigger than a skin, opt-in per game).
export interface ThemeUI {
  // Reframe the multiplier ladder + a live readout as a DEPTH meter (DEEP DIVE).
  depthMeter?: boolean;
  metersPerX?: number; // depth(m) = round((multiplier - 1) * metersPerX)
  // Ambient particle motion over the scene; intensity rises with the multiplier.
  motion?: { kind: 'bubbles' | 'embers' | 'steam' | 'speed'; color: string };
  // Loot that piles up as the multiplier climbs (sprite stacks revealed one by one).
  growth?: { sprites: string[] };
  // Zoom factor for cinematic scene videos whose source has black pillarbox
  // bars baked in — scales the video up so the picture fills the scene box edge
  // to edge (>1 crops the empty/black margins). Default 1 (no zoom). Either one
  // value for all scenes, or per scene (e.g. { lose: 1.9, win: 1.9 }).
  sceneZoom?: number | { idle?: number; lose?: number; win?: number; split?: number };
  // Idle "hold last frame then slowly pull back" drift (e.g. the BANKHEIST vault).
  idlePullback?: boolean;
  // When the idle loop clip finishes (play-once, no native loop), slowly zoom the
  // held last frame so there's still ambient motion (e.g. DEEP DIVE's depths).
  idleEndZoom?: boolean;
  // Mask the intro->loop hand-off with a brief darkening dip (the clip swap
  // happens at peak darkness), to hide a jump between two non-matching clips.
  idleHandoffDip?: boolean;
  // Start the idle loop clip this many seconds in, to line its first shown frame
  // up with the main clip's last frame (kills a tiny backward jump at the seam).
  idleLoopStartSec?: number;
  // Loop only the LAST N seconds of the idle loop clip (it plays through once,
  // then repeats just its tail) instead of replaying the whole clip.
  idleLoopTailSec?: number;
  // Idle clip plays through the betting countdown so its key moment (e.g. the
  // LIFTOFF launch) lands as the round starts — instead of holding on frame 0.
  idleSyncCountdown?: boolean;
  // Playback rate for the idle clip specifically (defaults to sceneSpeed). Lets
  // a countdown-synced launch be slowed to match the 5s countdown.
  idleSpeed?: number;
  // Slower rate during the betting countdown only (e.g. stretch the rocket's
  // ignition over the countdown, then speed up for the lift-off when running).
  idleSpeedBetting?: number;
  // Loop just the last N seconds of the idle clip when it ends (instead of
  // holding the last frame) — e.g. the rocket keeps flying while the round runs.
  idleTailLoop?: number;
  // How long before the round starts the countdown (tick) clip fires, so it ends
  // exactly at zero. Default 4600ms (the bomb-clock); match a shorter countdown.
  tickLeadMs?: number;
  // Explicit start offset (seconds) into the countdown clip, so a spoken "3"
  // lands on clock 3 (overrides the auto end-aligned offset).
  tickOffset?: number;
  // Playback rate for cinematic scene videos (<1 = slow-motion). Default 1.
  // One value for all scenes, or per scene (e.g. { lose: 0.85, win: 0.6 }).
  sceneSpeed?: number | { idle?: number; lose?: number; win?: number; split?: number };
  // Loop scene videos? Default true. Set false to play once and hold on the
  // last frame until the phase changes (e.g. the vault stays full for the round).
  sceneLoop?: boolean;
  // Scene keys whose video plays WITH its own audio (e.g. ['split'] so the
  // thief's shout is heard). All other scenes stay muted (game SFX take over).
  sceneSound?: ('idle' | 'lose' | 'win' | 'split')[];
  // Play the idle clip's audio at NORMAL speed, decoupled from the slow-mo
  // video (a separate audio element), so steam/horn aren't time-stretched.
  idleAudioNormal?: boolean;
  // The dedicated countdown clip carries its OWN audio (e.g. an "all aboard"
  // callout): play it un-muted and end-aligned (once, so its climax lands at
  // zero). The game's tick clock still plays alongside it.
  countdownSound?: boolean;
  // Play a spoken line (audio.sceneVoice) during a result scene, at a delay so it
  // lands on a specific beat of the (muted) clip — e.g. when the case hits the
  // deck. That scene also locks on screen until its clip finishes.
  sceneVoice?: { on: 'win' | 'lose' | 'split'; delayMs?: number; gain?: number };
  // Start a result clip this many seconds in (skip its buildup) — e.g. cut to the
  // implosion sooner. Per scene.
  sceneStartSec?: { lose?: number; win?: number; split?: number };
  // Linger on the idle poster (first frame) a beat longer at round start, then
  // gently fade the clip in (so the train clearly departs from a held station).
  idleFadeIn?: boolean;
  // Delay (ms) before the launch callout (audio.launch) fires at round start,
  // so the shout lands AFTER the departure horn (e.g. "ALL ABOARD!"). Default 0.
  launchDelayMs?: number;
}

export interface Theme {
  key: string;            // "bankheistx"
  name: string;           // "BANKHEIST X"
  publisher: string;      // "Olive Games"
  meta: { title: string; description: string };
  colors: ThemeColors;
  assets: ThemeAssets;
  audio: ThemeAudio;
  copy: ThemeCopy;
  ui?: ThemeUI;
}
