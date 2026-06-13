'use client';

// Adaptive audio engine using the supplied ElevenLabs clips + Suno bed.
//
// Three mixer buses, each with its own user slider (persisted):
//   - MUSIC  → the streamed Suno atmosphere bed (ducked while a round runs)
//   - SFX    → the tension motifs + stash / crash one-shots
//   - VOICE  → reserved for future announcer/voice clips
// All audio is gated behind the sound toggle (a user gesture — required to
// unlock audio on iOS Safari).

type Buffers = {
  low?: AudioBuffer;
  high?: AudioBuffer;
  stash?: AudioBuffer;
  crash?: AudioBuffer;
};

type Levels = { music: number; sfx: number; voice: number };
const LS_KEY = 'stash.audio.levels';

class TensionAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private buffers: Buffers = {};
  private lowSrc: AudioBufferSourceNode | null = null;
  private highSrc: AudioBufferSourceNode | null = null;
  private lowGain: GainNode | null = null;
  private highGain: GainNode | null = null;
  private lobby: HTMLAudioElement | null = null;
  private lobbyTimer: ReturnType<typeof setInterval> | undefined;

  enabled = false;
  private loaded = false;
  private loading = false;
  private running = false;
  private intensity = 0;

  private levels: Levels = { music: 0.5, sfx: 0.9, voice: 1.0 };

  constructor() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) this.levels = { ...this.levels, ...JSON.parse(raw) };
    } catch { /* defaults */ }
  }

  getLevels(): Levels {
    return { ...this.levels };
  }

  private persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.levels)); } catch { /* ignore */ }
  }

  private musicIdle() { return this.levels.music * 0.5; }
  private musicDuck() { return this.levels.music * 0.06; }

  private ensure() {
    if (this.ctx) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.ctx.destination);
    // mixer buses
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.levels.sfx;
    this.sfxGain.connect(this.master);
    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.value = this.levels.voice;
    this.voiceGain.connect(this.master);
    // Streamed atmosphere bed = MUSIC (don't fetch until first play).
    this.lobby = new Audio('/audio/lobby.mp3');
    this.lobby.loop = true;
    this.lobby.preload = 'none';
    this.lobby.volume = this.musicIdle();
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
      if (this.lobby) {
        this.lobby.volume = this.running ? this.musicDuck() : this.musicIdle();
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

  // ---- mixer sliders -----------------------------------------------------
  setMusic(v: number) {
    this.levels.music = Math.max(0, Math.min(1, v));
    this.persist();
    if (this.lobby) this.fadeLobby(this.running ? this.musicDuck() : this.musicIdle(), 200);
  }
  setSfx(v: number) {
    this.levels.sfx = Math.max(0, Math.min(1, v));
    this.persist();
    if (this.sfxGain && this.ctx) this.sfxGain.gain.setTargetAtTime(this.levels.sfx, this.ctx.currentTime, 0.05);
  }
  setVoice(v: number) {
    this.levels.voice = Math.max(0, Math.min(1, v));
    this.persist();
    if (this.voiceGain && this.ctx) this.voiceGain.gain.setTargetAtTime(this.levels.voice, this.ctx.currentTime, 0.05);
  }

  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.lowGain?.gain.setTargetAtTime(1 - this.intensity * 0.75, t, 0.25);
    this.highGain?.gain.setTargetAtTime(this.intensity * 0.85, t, 0.25);
    const rate = 1 + this.intensity * 0.25;
    this.lowSrc?.playbackRate.setTargetAtTime(rate, t, 0.25);
    this.highSrc?.playbackRate.setTargetAtTime(rate, t, 0.25);
  }

  // Smoothly fade the streamed atmosphere bed (HTMLAudio has no AudioParam).
  private fadeLobby(target: number, ms = 500) {
    if (!this.lobby) return;
    if (this.lobbyTimer) clearInterval(this.lobbyTimer);
    const start = this.lobby.volume;
    const steps = Math.max(1, Math.round(ms / 40));
    let i = 0;
    this.lobbyTimer = setInterval(() => {
      i++;
      const v = start + (target - start) * (i / steps);
      if (this.lobby) this.lobby.volume = Math.max(0, Math.min(1, v));
      if (i >= steps) { clearInterval(this.lobbyTimer); this.lobbyTimer = undefined; }
    }, 40);
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
      g.connect(this.sfxGain!);
      src.start();
      return { src, g };
    };
    const lo = mk(this.buffers.low!, 1);
    const hi = mk(this.buffers.high!, 0);
    this.lowSrc = lo.src; this.lowGain = lo.g;
    this.highSrc = hi.src; this.highGain = hi.g;
    this.setIntensity(this.intensity);
    this.fadeLobby(this.musicDuck(), 700); // music steps aside during the round
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
    if (this.enabled) this.fadeLobby(this.musicIdle(), 900); // music back between rounds
  }

  playStash() { this.oneShot(this.buffers.stash, 0.9); }

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
    g.connect(this.sfxGain!);
    src.start();
  }
}

let instance: TensionAudio | null = null;
export function getAudio(): TensionAudio {
  if (typeof window === 'undefined') return {} as TensionAudio;
  if (!instance) instance = new TensionAudio();
  return instance;
}
