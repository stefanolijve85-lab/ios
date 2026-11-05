import { ASSET_Q } from '../assetVer';
// Background music: one looping track for the menus and one for missions (public/audio/music_*.mp3), crossfaded,
// plus named ambience loops (e.g. the riot under the intro). A missing file simply stays silent. Volume is its own
// setting (Instellingen > Muziek); during a wave the mission track plays a little louder than between waves.
//
// iPhone/iPad: an <audio> element's volume is read-only there (always 1) and sound may only start from a tap that has
// been released (touchend/click, not pointerdown). So once the first tap arrives every element is routed through a Web
// Audio gain node, which does fade on iOS, and playback is (re)started from click/touchend/keydown.
export type Track = 'menu' | 'mission';
/** the ElevenLabs tracks are mastered loud: this keeps the music under the effects and the riot ambience (offline-measured) */
const MIX = 0.2;

interface Voice {
  el: HTMLAudioElement; gain: GainNode | null; level: number; target: number; missing: boolean;
  /** looping tracks: a second player that takes over at the end (an <audio loop> leaves a gap on Safari) */
  alt?: HTMLAudioElement; xg?: Map<HTMLAudioElement, GainNode>; swapping?: boolean; altPrimed?: boolean;
}
/** hand-over between the two players: the files are cut to loop seamlessly, this only covers the start-up jitter */
const XF = 0.2;

class Music {
  private voices = new Map<string, Voice>();
  private current: Track | null = null;
  private volume = 0.5;
  private intensity = 1;
  private extras = new Map<string, number>(); // ambience name -> wanted level (0..1, before the music volume)
  private raf = 0;
  private unlocked = false;
  private ctx: AudioContext | null = null;

  constructor() {
    // iOS: Web Audio follows the ring/silent switch unless the page declares itself a player (Safari 16.4+)
    try { const n = navigator as unknown as { audioSession?: { type: string } }; if (n.audioSession) n.audioSession.type = 'playback'; } catch { /* older browsers */ }
    const unlock = () => {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { this.ctx = null; }
        if (this.ctx) for (const v of [...this.voices.values(), ...this.shots.values()]) this.route(v);
      }
      this.primeShots(); this.primeAlts();
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
      this.unlocked = true; this.apply(true);
    };
    // every real tap retries: a play() refused once (iOS) is started on the next one
    for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, true);
    document.addEventListener('visibilitychange', () => {
      for (const v of this.voices.values()) if (document.hidden) { v.el.pause(); v.alt?.pause(); } else if (v.target > 0 && this.unlocked && !v.missing) void v.el.play().catch(() => {});
    });
    window.setInterval(() => this.handOver(), 50);
  }

  get isUnlocked() { return this.unlocked; }

  private route(v: Voice) {
    if (!this.ctx || v.gain) return;
    try {
      const g = this.ctx.createGain(); g.gain.value = v.level; g.connect(this.ctx.destination);
      if (v.alt) {
        v.xg = new Map();
        for (const el of [v.el, v.alt]) { const x = this.ctx.createGain(); x.gain.value = el === v.el ? 1 : 0; this.ctx.createMediaElementSource(el).connect(x).connect(g); el.volume = 1; v.xg.set(el, x); }
      } else { this.ctx.createMediaElementSource(v.el).connect(g); v.el.volume = 1; }
      v.gain = g;
    } catch { /* keep element volume */ }
  }
  /** iOS lets a player start without a tap only after it was started once inside one: do that, silently, for the spares */
  private primeAlts() {
    for (const v of this.voices.values()) {
      const a = v.alt; if (!a || v.altPrimed || !v.xg || v.swapping) continue;
      v.altPrimed = true; void a.play().then(() => { if (!v.swapping && a !== v.el) { a.pause(); a.currentTime = 0; } }).catch(() => { v.altPrimed = false; });
    }
  }
  /** a looping track near its end: the spare player starts at 0 and takes over within XF seconds */
  private handOver() {
    if (!this.ctx) return;
    for (const v of this.voices.values()) {
      const a = v.el, b = v.alt; if (!b || !v.xg || v.swapping || a.paused || !isFinite(a.duration) || a.duration < 1) continue;
      if (a.duration - a.currentTime > XF + 0.06) continue;
      v.swapping = true;
      try { b.currentTime = 0; } catch { /* ignore */ }
      void b.play().then(() => {
        const t = this.ctx!.currentTime; const ga = v.xg!.get(a)!.gain, gb = v.xg!.get(b)!.gain;
        ga.cancelScheduledValues(t); gb.cancelScheduledValues(t);
        ga.setValueAtTime(1, t); ga.linearRampToValueAtTime(0, t + XF); gb.setValueAtTime(0, t); gb.linearRampToValueAtTime(1, t + XF);
        v.el = b; v.alt = a;
        window.setTimeout(() => { a.pause(); try { a.currentTime = 0; } catch { /* ignore */ } v.swapping = false; }, XF * 1000 + 150);
      }).catch(() => { v.swapping = false; v.altPrimed = false; }); // not allowed yet: the 'ended' restart below covers it
    }
  }
  private voice(name: string, file: string): Voice {
    let v = this.voices.get(name);
    if (!v) {
      const mk = () => { const e = new Audio(file); e.loop = false; e.preload = 'auto'; e.volume = 0; return e; };
      const el = mk(), alt = mk();
      v = { el, alt, gain: null, level: 0, target: 0, missing: false };
      const vv = v;
      for (const e of [el, alt]) {
        e.addEventListener('error', () => { vv.missing = true; });
        // safety net: if the hand-over did not happen, the track simply starts again on the same player
        e.addEventListener('ended', () => { if (vv.el === e && vv.target > 0 && !vv.swapping) { try { e.currentTime = 0; } catch { /* ignore */ } void e.play().catch(() => {}); } });
      }
      this.voices.set(name, v); this.route(v);
    }
    return v;
  }
  private setLevel(v: Voice, x: number) { v.level = x; if (v.gain) v.gain.gain.value = x; else v.el.volume = Math.max(0, Math.min(1, x)); }

  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); this.apply(); }
  /** 0..1: how intense the moment is (a running wave = 1, calm prep = 0) */
  setIntensity(k: number) { const n = 0.65 + 0.35 * Math.max(0, Math.min(1, k)); if (Math.abs(n - this.intensity) > 0.01) { this.intensity = n; this.apply(); } }
  play(t: Track) { if (this.current === t) return; this.current = t; this.apply(true); }
  /** dip the music for a few seconds (a voice line on top), then let it come back */
  duck(seconds: number) {
    this.ducked = 0.3; this.apply();
    clearTimeout(this.duckT); this.duckT = window.setTimeout(() => { this.ducked = 1; this.apply(); }, seconds * 1000);
  }
  private ducked = 1; private duckT = 0;

  // ---- one-shot recordings (the victory fanfare and voice) through the same <audio> route as the music, which is
  // the route that demonstrably plays on iPad. Each element is started once inside a tap (silently) so iOS lets it
  // play later without one.
  private shots = new Map<string, Voice & { primed?: boolean; live?: boolean }>();
  private shot(name: string) {
    let v = this.shots.get(name);
    if (!v) {
      const el = new Audio(`audio/${name}.mp3${ASSET_Q}`); el.preload = 'auto'; el.loop = false;
      const nv: Voice & { primed?: boolean; live?: boolean } = { el, gain: null, level: 0, target: 0, missing: false };
      el.addEventListener('error', () => { nv.missing = true; });
      el.addEventListener('ended', () => { nv.live = false; });
      this.shots.set(name, nv); this.route(nv); try { el.load(); } catch { /* ignore */ }
      v = nv;
    }
    return v;
  }
  private primeShots() {
    for (const v of this.shots.values()) {
      if (v.primed || v.live || !v.gain) continue; // without the gain node it would be audible: iOS ignores el.volume
      v.primed = true; v.gain.gain.value = 0;
      void v.el.play().then(() => { if (!v.live) { v.el.pause(); v.el.currentTime = 0; } }).catch(() => { v.primed = false; });
    }
  }
  /** start downloading these recordings now (e.g. at the start of a mission) */
  prepareShots(names: string[]) { for (const n of names) this.shot(n); this.primeShots(); }
  /** play a recording once at the given level (0..2), optionally after a delay (s); false when it cannot play */
  playShot(name: string, level: number, delay = 0): boolean {
    const v = this.shot(name); if (v.missing) return false;
    const go = () => {
      v.live = true; v.level = level;
      if (v.gain) { const g = v.gain.gain; g.cancelScheduledValues(0); g.value = level; } else v.el.volume = Math.max(0, Math.min(1, level));
      try { v.el.currentTime = 0; } catch { /* ignore */ }
      void v.el.play().catch(() => { v.live = false; });
    };
    if (delay > 0) window.setTimeout(go, delay * 1000); else go();
    return true;
  }
  /** ramp a playing recording to a level, starting `at` s from now and taking `dur` s (Web Audio route only) */
  rampShot(name: string, level: number, at: number, dur: number) {
    const v = this.shots.get(name); if (!v || !v.gain || !this.ctx) return;
    const g = v.gain.gain, t = this.ctx.currentTime;
    g.setValueAtTime(g.value, t + at); g.linearRampToValueAtTime(level, t + at + dur);
  }
  stopShot(name: string) { const v = this.shots.get(name); if (v) { v.live = false; v.el.pause(); } }
  /** a looping ambience next to the music (e.g. 'riot' under the intro); level 0 fades it out */
  ambience(name: string, level: number) { this.extras.set(name, Math.max(0, level)); this.apply(true); }

  private apply(start = false) {
    if (this.current) this.voice(this.current, `audio/music_${this.current}.mp3${ASSET_Q}`);
    for (const [name] of this.extras) this.voice('amb:' + name, `audio/${name}_loop.mp3${ASSET_Q}`);
    for (const [name, v] of this.voices) {
      v.target = name.startsWith('amb:') ? (this.extras.get(name.slice(4)) ?? 0)
        : name === this.current ? this.volume * this.intensity * MIX * this.ducked : 0;
      if (v.target > 0 && (start || v.el.paused) && this.unlocked && !v.missing) void v.el.play().catch(() => {});
    }
    // fade towards the target levels (the voice keeps its own level: iOS cannot read a volume back)
    cancelAnimationFrame(this.raf);
    const step = () => {
      let busy = false;
      for (const v of this.voices.values()) {
        const d = v.target - v.level;
        if (Math.abs(d) > 0.004) { this.setLevel(v, v.level + Math.sign(d) * Math.min(Math.abs(d), 0.015)); busy = true; }
        else { this.setLevel(v, v.target); if (v.target === 0 && !v.el.paused) { v.el.pause(); v.alt?.pause(); } }
      }
      if (busy) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
}

export const music = new Music();
(window as unknown as { __music?: Music }).__music = music; // inspected by the automated browser checks
