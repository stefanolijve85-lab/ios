// Background music: one looping track for the menus and one for missions (public/audio/music_*.mp3), crossfaded.
// A missing file simply stays silent. Volume is its own setting (Instellingen > Muziek); during a wave the mission
// track plays a little louder than between waves.
export type Track = 'menu' | 'mission';
/** the ElevenLabs tracks are mastered loud: this keeps the music under the effects and the riot ambience (offline-measured) */
const MIX = 0.2;

class Music {
  private els = new Map<Track, HTMLAudioElement>();
  private current: Track | null = null;
  private volume = 0.5;
  private intensity = 1;
  private raf = 0;
  private unlocked = false;

  constructor() {
    // browsers (iOS above all) only start audio after a tap: retry the current track on the first one
    const unlock = () => { this.unlocked = true; this.apply(true); window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); };
    window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
    document.addEventListener('visibilitychange', () => { for (const el of this.els.values()) if (document.hidden) el.pause(); else if (el.dataset.on === '1') void el.play().catch(() => {}); });
  }

  private el(t: Track): HTMLAudioElement {
    let el = this.els.get(t);
    if (!el) {
      el = new Audio(`audio/music_${t}.mp3`); el.loop = true; el.preload = 'auto'; el.volume = 0;
      el.addEventListener('error', () => { el!.dataset.missing = '1'; });
      this.els.set(t, el);
    }
    return el;
  }

  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); this.apply(); }
  /** 0..1: how intense the moment is (a running wave = 1, calm prep = 0) */
  setIntensity(k: number) { const n = 0.65 + 0.35 * Math.max(0, Math.min(1, k)); if (Math.abs(n - this.intensity) > 0.01) { this.intensity = n; this.apply(); } }
  play(t: Track) { if (this.current === t) return; this.current = t; this.apply(true); }

  private apply(start = false) {
    for (const [t, el] of [...this.els, ...(this.current && !this.els.has(this.current) ? [[this.current, this.el(this.current)] as const] : [])]) {
      const on = t === this.current && this.volume > 0;
      el.dataset.on = on ? '1' : '0';
      if (on && (start || el.paused) && this.unlocked && el.dataset.missing !== '1') void el.play().catch(() => {});
    }
    // fade towards the target levels
    cancelAnimationFrame(this.raf);
    const step = () => {
      let busy = false;
      for (const [t, el] of this.els) {
        const target = t === this.current ? this.volume * this.intensity * MIX : 0;
        const d = target - el.volume;
        if (Math.abs(d) > 0.005) { el.volume = Math.max(0, Math.min(1, el.volume + Math.sign(d) * Math.min(Math.abs(d), 0.02))); busy = true; }
        else { el.volume = target; if (target === 0 && !el.paused) el.pause(); }
      }
      if (busy) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
}

export const music = new Music();
