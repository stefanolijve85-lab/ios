// ---------------------------------------------------------------------------
// Web Audio sound engine for QUANTUM SPIN. Fully synthesised (oscillators +
// noise + filters) so the game ships with rich, adaptive audio and ZERO audio
// files — drop real SFX/music into public/themes/<theme>/audio later and point
// playSample() at them. Adaptive: win stingers scale with win size, and an
// ambient pad shifts brighter during the free-spins feature.
// ---------------------------------------------------------------------------

type SfxName =
  | 'spin' | 'stop' | 'land' | 'tick'
  | 'win' | 'bigwin' | 'megawin' | 'coin'
  | 'portal' | 'jackpot' | 'button';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode[] = [];
  private _muted = false;
  private _volume = 0.7;
  private started = false;

  get muted() {
    return this._muted;
  }

  // Must be called from a user gesture (browser autoplay policy).
  init() {
    if (this.started) return;
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this._muted ? 0 : this._volume;
    this.master.connect(this.ctx.destination);
    this.started = true;
    this.startAmbient();
  }

  resume() {
    this.ctx?.resume();
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this._volume;
  }
  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.master && !this._muted) this.master.gain.value = this._volume;
  }

  private now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // A soft evolving pad so the lobby never feels dead.
  private startAmbient() {
    if (!this.ctx || !this.master) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.05;
    this.ambientGain.connect(this.master);
    const freqs = [55, 82.4, 110];
    for (const f of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(this.ambientGain);
      osc.start();
      lfo.start();
      this.ambientOsc.push(osc, lfo);
    }
  }

  // Brighten/dim the ambient bed (feature vs base).
  setMood(feature: boolean) {
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(feature ? 0.09 : 0.05, this.now(), 0.6);
    }
  }

  private beep(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.25, slideTo?: number) {
    if (!this.ctx || !this.master || this._muted) return;
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, gain = 0.2, hp = 800) {
    if (!this.ctx || !this.master || this._muted) return;
    const t = this.now();
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  play(name: SfxName, intensity = 0) {
    switch (name) {
      case 'button': this.beep(420, 0.06, 'triangle', 0.15); break;
      case 'spin': this.beep(180, 0.5, 'sawtooth', 0.12, 520); this.noise(0.5, 0.06, 1200); break;
      case 'stop': this.beep(320, 0.08, 'square', 0.12, 160); break;
      case 'land': this.beep(240 + intensity * 40, 0.08, 'triangle', 0.14); break;
      case 'tick': this.beep(1200, 0.03, 'square', 0.08); break;
      case 'coin': this.beep(880, 0.05, 'square', 0.12, 1320); this.beep(1320, 0.06, 'square', 0.1); break;
      case 'win': this.arpeggio([523, 659, 784], 0.09, 0.18); break;
      case 'bigwin': this.arpeggio([523, 659, 784, 1046, 1319], 0.1, 0.22); break;
      case 'megawin': this.arpeggio([392, 523, 659, 784, 1046, 1319, 1568], 0.11, 0.26); this.noise(0.6, 0.1, 400); break;
      case 'portal': this.beep(120, 0.9, 'sine', 0.2, 900); this.noise(0.9, 0.12, 300); break;
      case 'jackpot': this.arpeggio([523, 784, 1046, 1319, 1568, 2093], 0.12, 0.3); this.noise(1.0, 0.12, 500); break;
    }
  }

  private arpeggio(notes: number[], step: number, gain: number) {
    if (!this.ctx) return;
    notes.forEach((f, i) => {
      setTimeout(() => this.beep(f, step * 2.2, 'triangle', gain), i * step * 1000);
    });
  }
}

export const audio = new AudioEngine();
export type { SfxName };
