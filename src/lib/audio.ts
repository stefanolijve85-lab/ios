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
  lobby?: AudioBuffer;
  tick?: AudioBuffer;
};

type Levels = { music: number; sfx: number; voice: number };
const LS_KEY = 'stash.audio.levels';

class TensionAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private buffers: Buffers = {};
  private voiceCrash: AudioBuffer[] = []; // random "They got away!" lines
  private voiceWin: AudioBuffer[] = [];   // random "Nice grab!" lines (big secures)
  private lowSrc: AudioBufferSourceNode | null = null;
  private highSrc: AudioBufferSourceNode | null = null;
  private tickSrc: AudioBufferSourceNode | null = null;
  private lowGain: GainNode | null = null;
  private highGain: GainNode | null = null;
  enabled = false;
  private loaded = false;
  private loading = false;
  private running = false;
  private ticking = false;
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

  // Music gain levels (routed through Web Audio so iOS respects them — iOS
  // ignores HTMLAudioElement.volume entirely).
  private musicIdle() { return this.levels.music * 0.6; }
  private musicDuck() { return this.levels.music * 0.08; }

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
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicIdle();
    this.musicGain.connect(this.master);
  }

  // The ambient bed is a looping AudioBuffer (sample-accurate loop — no click/gap
  // that an HTMLAudio loop would introduce).
  private startMusic() {
    if (!this.enabled || !this.ctx || !this.buffers.lobby || this.musicSource) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.lobby;
    src.loop = true;
    src.connect(this.musicGain!);
    src.start();
    this.musicSource = src;
  }
  private stopMusic() {
    try { this.musicSource?.stop(); } catch { /* already stopped */ }
    this.musicSource = null;
  }

  // Smoothly ramp the music bus gain.
  private fadeMusic(target: number, ms = 600) {
    if (!this.musicGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setTargetAtTime(Math.max(0.0001, target), t, Math.max(0.05, ms / 3000));
  }

  private async load() {
    if (this.loaded || this.loading || !this.ctx) return;
    this.loading = true;
    // Decode each clip independently so one bad/slow file can never silence the
    // rest (a single failing decode used to take down the whole batch).
    const set = async (key: keyof Buffers, url: string) => {
      try {
        const res = await fetch(url);
        const ab = await res.arrayBuffer();
        this.buffers[key] = await this.ctx!.decodeAudioData(ab);
      } catch { /* skip this one */ }
    };
    await Promise.allSettled([
      set('low', '/audio/motif-low.mp3'),
      set('high', '/audio/motif-high.mp3'),
      set('stash', '/audio/stash.mp3'),
      set('crash', '/audio/crash.mp3'),
      set('lobby', '/audio/lobby.mp3'),
      set('tick', '/audio/tick.mp3'),
    ]);
    // crash + win voice lines (random pick) — load independently
    const loadVoices = (prefix: string, into: AudioBuffer[]) =>
      Promise.allSettled([1, 2, 3, 4, 5].map(async (n) => {
        try {
          const res = await fetch(`/audio/${prefix}-${n}.mp3`);
          if (!res.ok) return;
          const ab = await res.arrayBuffer();
          into.push(await this.ctx!.decodeAudioData(ab));
        } catch { /* skip */ }
      }));
    await Promise.allSettled([
      loadVoices('voice-crash', this.voiceCrash),
      loadVoices('voice-win', this.voiceWin),
    ]);
    this.loaded = true;
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
      this.fadeMusic(this.running ? this.musicDuck() : this.musicIdle(), 300);
      this.load().then(() => {
        if (!this.enabled) return;
        this.startMusic();
        if (this.running) this.startMotif();
        else if (this.ticking) this.startTick();
      });
    } else {
      this.stopSources();
      this.stopTick();
      this.stopMusic();
    }
    return this.enabled;
  }

  // ---- mixer sliders -----------------------------------------------------
  setMusic(v: number) {
    this.levels.music = Math.max(0, Math.min(1, v));
    this.persist();
    this.fadeMusic(this.running ? this.musicDuck() : this.musicIdle(), 150);
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

  startMotif() {
    this.running = true;
    if (!this.enabled || !this.ctx || !this.buffers.low || !this.buffers.high) return;
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
    this.fadeMusic(this.musicDuck(), 700); // music steps aside during the round
  }

  // Ticking clock during the betting countdown (VAULT CLOSES IN).
  startTick() {
    this.ticking = true;
    if (!this.enabled || !this.ctx || !this.buffers.tick || this.tickSrc) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.tick;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = 0.6;
    src.connect(g);
    g.connect(this.sfxGain!);
    src.start();
    this.tickSrc = src;
  }
  stopTick() {
    this.ticking = false;
    try { this.tickSrc?.stop(); } catch { /* already stopped */ }
    this.tickSrc = null;
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
    if (this.enabled) this.fadeMusic(this.musicIdle(), 900); // music back between rounds
  }

  playStash(_multiplier = 0) {
    this.oneShot(this.buffers.stash, 1.0);
    // a triumphant voice line on every secure
    if (this.voiceWin.length) {
      const v = this.voiceWin[Math.floor(Math.random() * this.voiceWin.length)];
      this.oneShot(v, 1.0, this.voiceGain, 0.2);
    }
  }

  // Always stops the round motif; only plays the alarm + voice if the player
  // actually lost (was still holding). If you already secured, you're safe → quiet.
  crash(lost = true) {
    this.running = false;
    this.stopSources();
    if (!lost) return;
    this.oneShot(this.buffers.crash, 1.0);
    // random voice line ("They got away!") on its own bus, just after the alarm
    if (this.voiceCrash.length) {
      const v = this.voiceCrash[Math.floor(Math.random() * this.voiceCrash.length)];
      this.oneShot(v, 1.0, this.voiceGain, 0.35);
    }
  }

  private oneShot(buf: AudioBuffer | undefined, vol: number, bus?: GainNode | null, delay = 0) {
    if (!this.enabled || !this.ctx || !buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(bus ?? this.sfxGain!);
    src.start(this.ctx.currentTime + delay);
  }
}

let instance: TensionAudio | null = null;
export function getAudio(): TensionAudio {
  if (typeof window === 'undefined') return {} as TensionAudio;
  if (!instance) instance = new TensionAudio();
  return instance;
}
