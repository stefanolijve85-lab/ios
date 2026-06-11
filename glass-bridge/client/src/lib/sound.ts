/**
 * Procedural audio via the Web Audio API — no binary assets required.
 * Provides the spec's feedback: glass tick (safe), shatter (break), rising
 * cash-out chime, and a jackpot flourish for big wins.
 */
type SoundName = 'tick' | 'shatter' | 'cashout' | 'jackpot' | 'click';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  volume = 0.6;

  private ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.3) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    g.gain.setValueAtTime(0, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(g).connect(this.master!);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.02);
  }

  private noise(start: number, dur: number, gain = 0.4) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.master!);
    src.start(ctx.currentTime + start);
  }

  play(name: SoundName) {
    if (!this.enabled) return;
    this.ensure();
    switch (name) {
      case 'tick':
        this.tone(1400, 0, 0.12, 'triangle', 0.25);
        this.tone(2100, 0.01, 0.1, 'sine', 0.15);
        break;
      case 'click':
        this.tone(700, 0, 0.06, 'square', 0.12);
        break;
      case 'shatter':
        this.noise(0, 0.5, 0.5);
        this.tone(180, 0, 0.5, 'sawtooth', 0.25);
        this.tone(90, 0.08, 0.6, 'sine', 0.3);
        break;
      case 'cashout':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.08, 0.22, 'triangle', 0.28));
        break;
      case 'jackpot':
        [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, i * 0.07, 0.3, 'sawtooth', 0.22));
        this.noise(0.1, 0.4, 0.2);
        break;
    }
  }
}

export const sound = new SoundEngine();
