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

interface Voice { el: HTMLAudioElement; gain: GainNode | null; level: number; target: number; missing: boolean }

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
    const unlock = () => {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { this.ctx = null; }
        if (this.ctx) for (const v of this.voices.values()) this.route(v);
      }
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
      this.unlocked = true; this.apply(true);
    };
    // every real tap retries: a play() refused once (iOS) is started on the next one
    for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, true);
    document.addEventListener('visibilitychange', () => {
      for (const v of this.voices.values()) if (document.hidden) v.el.pause(); else if (v.target > 0 && this.unlocked && !v.missing) void v.el.play().catch(() => {});
    });
  }

  get isUnlocked() { return this.unlocked; }

  private route(v: Voice) {
    if (!this.ctx || v.gain) return;
    try {
      const src = this.ctx.createMediaElementSource(v.el); const g = this.ctx.createGain(); g.gain.value = v.level;
      src.connect(g).connect(this.ctx.destination); v.el.volume = 1; v.gain = g;
    } catch { /* keep element volume */ }
  }
  private voice(name: string, file: string): Voice {
    let v = this.voices.get(name);
    if (!v) {
      const el = new Audio(file); el.loop = true; el.preload = 'auto'; el.volume = 0;
      v = { el, gain: null, level: 0, target: 0, missing: false };
      const vv = v; el.addEventListener('error', () => { vv.missing = true; });
      this.voices.set(name, v); this.route(v);
    }
    return v;
  }
  private setLevel(v: Voice, x: number) { v.level = x; if (v.gain) v.gain.gain.value = x; else v.el.volume = Math.max(0, Math.min(1, x)); }

  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); this.apply(); }
  /** 0..1: how intense the moment is (a running wave = 1, calm prep = 0) */
  setIntensity(k: number) { const n = 0.65 + 0.35 * Math.max(0, Math.min(1, k)); if (Math.abs(n - this.intensity) > 0.01) { this.intensity = n; this.apply(); } }
  play(t: Track) { if (this.current === t) return; this.current = t; this.apply(true); }
  /** a looping ambience next to the music (e.g. 'riot' under the intro); level 0 fades it out */
  ambience(name: string, level: number) { this.extras.set(name, Math.max(0, level)); this.apply(true); }

  private apply(start = false) {
    if (this.current) this.voice(this.current, `audio/music_${this.current}.mp3`);
    for (const [name] of this.extras) this.voice('amb:' + name, `audio/${name}_loop.mp3`);
    for (const [name, v] of this.voices) {
      v.target = name.startsWith('amb:') ? (this.extras.get(name.slice(4)) ?? 0)
        : name === this.current ? this.volume * this.intensity * MIX : 0;
      if (v.target > 0 && (start || v.el.paused) && this.unlocked && !v.missing) void v.el.play().catch(() => {});
    }
    // fade towards the target levels (the voice keeps its own level: iOS cannot read a volume back)
    cancelAnimationFrame(this.raf);
    const step = () => {
      let busy = false;
      for (const v of this.voices.values()) {
        const d = v.target - v.level;
        if (Math.abs(d) > 0.004) { this.setLevel(v, v.level + Math.sign(d) * Math.min(Math.abs(d), 0.015)); busy = true; }
        else { this.setLevel(v, v.target); if (v.target === 0 && !v.el.paused) v.el.pause(); }
      }
      if (busy) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
}

export const music = new Music();
(window as unknown as { __music?: Music }).__music = music; // inspected by the automated browser checks
