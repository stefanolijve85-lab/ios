// Small synthesised sound effects (no audio files needed). Volume 0 disables output.
type Cue = 'click' | 'buy' | 'deny' | 'intercept' | 'extract' | 'breach' | 'wave' | 'win' | 'lose' | 'fire' | 'upgrade' | 'held';

export class Sfx {
  private ctx: AudioContext | null = null;
  private last = new Map<Cue, number>();
  constructor(public volume: number) {}
  private ensure() {
    if (this.ctx || this.volume <= 0) return this.ctx;
    try { this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { this.ctx = null; }
    return this.ctx;
  }
  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0, delay = 0) {
    const c = this.ensure(); if (!c) return;
    if (c.state === 'suspended') void c.resume();
    const t = c.currentTime + delay;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * this.volume, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  play(cue: Cue) {
    if (this.volume <= 0) return;
    const now = performance.now(); if ((this.last.get(cue) ?? 0) > now - 70) return; this.last.set(cue, now);
    switch (cue) {
      case 'click': this.tone(880, 0.05, 'square', 0.05); break;
      case 'buy': this.tone(520, 0.08, 'triangle', 0.15); this.tone(780, 0.1, 'triangle', 0.12, 0, 0.07); break;
      case 'deny': this.tone(200, 0.18, 'sawtooth', 0.08, -60); break;
      case 'intercept': this.tone(660, 0.12, 'triangle', 0.15, 200); break;
      case 'held': this.tone(140, 0.12, 'square', 0.06); break;
      case 'extract': this.tone(330, 0.2, 'sawtooth', 0.08, -150); break;
      case 'breach': this.tone(110, 0.3, 'sawtooth', 0.12, -50); break;
      case 'wave': this.tone(440, 0.2, 'triangle', 0.15); this.tone(554, 0.2, 'triangle', 0.15, 0, 0.18); this.tone(659, 0.3, 'triangle', 0.15, 0, 0.36); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.15, 0, i * 0.15)); break;
      case 'lose': [392, 330, 262].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.15, 0, i * 0.2)); break;
      case 'fire': this.tone(90, 0.5, 'sawtooth', 0.05, 60); break;
      case 'upgrade': this.tone(600, 0.1, 'sine', 0.15, 400); break;
    }
  }
}
