'use client';

// Adaptive audio engine using the supplied ElevenLabs clips + Suno bed.
//
// - Two looping tension motifs (calm "low" + nervous "high") are cross-faded by
//   the round's intensity, and BOTH speed up / pitch up slightly as the
//   multiplier climbs — so the same motif "rises higher and faster", exactly per
//   the design brief. Glitch one-shot + silence on crash.
// - The Suno track plays as a quiet looping atmosphere bed (streamed, ducked
//   during the tense final stretch). All audio is gated behind the sound toggle
//   (a user gesture — required to unlock audio on iOS Safari).

type Buffers = {
  low?: AudioBuffer;
  high?: AudioBuffer;
  stash?: AudioBuffer;
  crash?: AudioBuffer;
};

class TensionAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers: Buffers = {};
  private lowSrc: AudioBufferSourceNode | null = null;
  private highSrc: AudioBufferSourceNode | null = null;
  private lowGain: GainNode | null = null;
  private highGain: GainNode | null = null;
  private lobby: HTMLAudioElement | null = null;

  enabled = false;
  private loaded = false;
  private loading = false;
  private running = false;
  private intensity = 0;

  private ensure() {
    if (this.ctx) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.ctx.destination);
    // Streamed atmosphere bed (don't fetch until first play).
    this.lobby = new Audio('/audio/lobby.mp3');
    this.lobby.loop = true;
    this.lobby.preload = 'none';
    this.lobby.volume = 0.12;
  }

  private async load() {
    if (this.loaded || this.loading || !this.ctx) return;
    this.loading = true;
    const get = async (url: string) => {
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      return await this.ctx!.decodeAudioData(ab);
    };
    try {
      const [low, high, stash, crash] = await Promise.all([
        get('/audio/motif-low.mp3'),
        get('/audio/motif-high.mp3'),
        get('/audio/stash.mp3'),
        get('/audio/crash.mp3'),
      ]);
      this.buffers = { low, high, stash, crash };
      this.loaded = true;
    } catch {
      /* leave unloaded; engine degrades to silence */
    }
    this.loading = false;
  }

  // Called from the sound toggle (user gesture → unlocks iOS audio).
  async toggle(): Promise<boolean> {
    this.ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.enabled = !this.enabled;
    const t = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(t);
    this.master!.gain.linearRampToValueAtTime(this.enabled ? 0.6 : 0.0001, t + 0.2);

    if (this.enabled) {
      // Kick the streamed bed inside the gesture, then load buffers.
      if (this.lobby) {
        this.lobby.volume = 0.12;
        this.lobby.play().catch(() => {});
      }
      this.load().then(() => {
        if (this.enabled && this.running) this.startMotif();
      });
    } else {
      this.stopSources();
      this.lobby?.pause();
    }
    return this.enabled;
  }

  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Cross-fade calm → nervous.
    this.lowGain?.gain.setTargetAtTime(1 - this.intensity * 0.85, t, 0.25);
    this.highGain?.gain.setTargetAtTime(this.intensity, t, 0.25);
    // Same motif rises in pitch + tempo.
    const rate = 1 + this.intensity * 0.25;
    this.lowSrc?.playbackRate.setTargetAtTime(rate, t, 0.25);
    this.highSrc?.playbackRate.setTargetAtTime(rate, t, 0.25);
    // Duck the atmosphere bed as tension peaks.
    if (this.lobby && this.enabled) {
      this.lobby.volume = Math.max(0.04, 0.12 * (1 - this.intensity));
    }
  }

  startMotif() {
    this.running = true;
    if (!this.enabled || !this.ctx || !this.loaded) return;
    this.stopSources();
    const mk = (buf: AudioBuffer, g0: number) => {
      const src = this.ctx!.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = this.ctx!.createGain();
      g.gain.value = g0;
      src.connect(g);
      g.connect(this.master!);
      src.start();
      return { src, g };
    };
    const lo = mk(this.buffers.low!, 1);
    const hi = mk(this.buffers.high!, 0);
    this.lowSrc = lo.src; this.lowGain = lo.g;
    this.highSrc = hi.src; this.highGain = hi.g;
    this.setIntensity(this.intensity);
  }

  private stopSources() {
    [this.lowSrc, this.highSrc].forEach((s) => { try { s?.stop(); } catch { /* already stopped */ } });
    this.lowSrc = this.highSrc = null;
    this.lowGain = this.highGain = null;
  }

  stopMotif() {
    this.running = false;
    this.intensity = 0;
    this.stopSources();
    if (this.lobby && this.enabled) this.lobby.volume = 0.12; // restore bed between rounds
  }

  // The STASH reward sound.
  playStash() {
    this.oneShot(this.buffers.stash, 0.9);
  }

  // Glitch on crash → natural silence during the crashed phase → reset next round.
  crash() {
    this.running = false;
    this.stopSources();
    this.oneShot(this.buffers.crash, 1.0);
  }

  private oneShot(buf: AudioBuffer | undefined, vol: number) {
    if (!this.enabled || !this.ctx || !buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(this.master!);
    src.start();
  }
}

let instance: TensionAudio | null = null;
export function getAudio(): TensionAudio {
  if (typeof window === 'undefined') return {} as TensionAudio;
  if (!instance) instance = new TensionAudio();
  return instance;
}
