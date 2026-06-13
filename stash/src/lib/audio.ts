'use client';

// Adaptive tension engine (Web Audio API — no asset files, no music, no vocals).
// A single repeating electronic motif whose pitch + tempo climb with the
// multiplier, mirroring the emotional climb. Glitch + half-second silence on crash.

class TensionAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private seqTimer: number | null = null;
  private intensity = 0; // 0..1
  private running = false;
  private step = 0;
  enabled = false;

  private ensure() {
    if (this.ctx) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.ctx.destination);
  }

  // Must be called from a user gesture (iOS Safari unlock).
  async toggle(): Promise<boolean> {
    this.ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.enabled = !this.enabled;
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.enabled ? 0.5 : 0.0001, this.ctx.currentTime + 0.2);
    }
    return this.enabled;
  }

  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
  }

  startMotif() {
    if (!this.enabled) return;
    this.ensure();
    if (this.running) return;
    this.running = true;
    this.step = 0;
    const tick = () => {
      if (!this.running) return;
      this.blip();
      // Tempo accelerates with intensity: 320ms calm -> 90ms frantic.
      const interval = 320 - this.intensity * 230;
      this.seqTimer = window.setTimeout(tick, interval);
    };
    tick();
  }

  stopMotif() {
    this.running = false;
    if (this.seqTimer) {
      clearTimeout(this.seqTimer);
      this.seqTimer = null;
    }
  }

  private blip() {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    // Pitch climbs ~220Hz -> ~880Hz as intensity rises, with a small arp.
    const base = 220 + this.intensity * 660;
    const arp = [0, 7, 12, 7][this.step % 4];
    const freq = base * Math.pow(2, arp / 12);
    this.step++;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const vol = 0.12 + this.intensity * 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  crash() {
    this.stopMotif();
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    // Digital glitch burst.
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
    // Then half-second silence — handled naturally; motif restarts next round.
  }
}

let instance: TensionAudio | null = null;
export function getAudio(): TensionAudio {
  if (typeof window === 'undefined') return {} as TensionAudio;
  if (!instance) instance = new TensionAudio();
  return instance;
}
