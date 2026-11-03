// Synthesised sound (Web Audio, no audio files, no network). Volume 0 disables everything.
//
// Three layers:
//  - UI cues (clicks, purchase, deny) played in the centre
//  - world cues placed in the stereo field by where they happen on screen and quieter when zoomed out or off-screen
//    (glass, smashing, whistle, whoosh, hiss, truck horn…)
//  - a living ambience that follows the game state: city hum, a crowd that swells with the number of rioters,
//    fire roar and crackle near burning buildings, a firefighter's hose hiss, hammering on boards and barriers, and
//    sirens in the distance during a wave.
export type Cue =
  | 'click' | 'buy' | 'deny' | 'intercept' | 'extract' | 'breach' | 'wave' | 'win' | 'lose' | 'fire' | 'upgrade' | 'held'
  | 'glass' | 'barrierBroken' | 'impact' | 'release' | 'extinguished' | 'supply' | 'dispatch' | 'collect' | 'recovered' | 'place'
  | 'gasThrow' | 'gasLand' | 'strike' | 'scream' | 'flashBang' | 'throwBack';

export interface Listener { pan: number; gain: number }
export interface AmbienceState {
  /** rioters on the map (0..n) */ crowd: number;
  /** burning fires with their stereo placement */ fires: Listener[];
  /** units hammering at boards/barriers right now */ hammering: Listener[];
  /** firefighters spraying right now */ hoses: Listener[];
  /** a wave / looting run is in progress */ active: boolean;
  /** tear gas clouds on the ground */ gas?: Listener[];
  /** the fire engine: its pump runs while a hose is out */ engine?: Listener | null;
  /** the fire engine just pulled up */ engineArrived?: boolean;
  /** 0..1 how much of the crowd is in panic (in gas, fleeing, being struck) */ panic?: number;
  /** rioters smashing shutters and barriers right now */ smashing?: number;
  /** the match is paused or a modal is open */ paused: boolean;
  /** the map has a fountain in view */ fountain?: Listener | null;
}

type Ctx = AudioContext;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class Sfx {
  private ctx: Ctx | null = null;
  private master!: GainNode; private ui!: GainNode; private world!: GainNode; private amb!: GainNode;
  private noise!: AudioBuffer; private brown!: AudioBuffer; private pink!: AudioBuffer;
  private last = new Map<string, number>();
  private bed: { crowd: GainNode; crowdF: BiquadFilterNode; hum: GainNode; roar: GainNode; roarP: StereoPannerNode; hiss: GainNode; hissP: StereoPannerNode; water: GainNode; waterP: StereoPannerNode } | null = null;
  /** recorded sounds (public/audio/*.mp3, generated with ElevenLabs); each falls back to the synthesis below if missing */
  static readonly SAMPLES = ['glass', 'barrier', 'wood_hit', 'whistle', 'shield', 'ignite', 'fire_loop', 'hose_loop', 'steam', 'crowd_loop', 'city_loop', 'siren', 'horn', 'rustle', 'molotov', 'shutter', 'fountain_loop', 'crowd_shout',
    'riot_loop', 'panic_loop', 'riot_yell', 'scream', 'cough', 'gas_launch', 'gas_hiss', 'smash', 'baton',
    'win_sting', 'vo_win_nl', 'vo_win_en', 'flashbang', 'engine_arrive', 'pump_loop', 'sizzle_loop', 'hose_charge'] as const;
  private buf = new Map<string, { b: AudioBuffer; norm: number }>();
  /** recordings are peak-normalised to 1, far hotter than the synthesis: these bring one-shots and loops back to its level */
  private static readonly REC_LEVEL = 0.28;
  private static readonly LOOP_LEVEL = 0.2;
  private loops = new Map<string, GainNode>();
  private hosesBefore = 0;
  private pumpP: StereoPannerNode | null = null;
  private crackleT = 0; private hammerT = 0; private sirenT = 30; private shoutT = 4; private yellT = 3; private coughT = 2; private screamT = 5;
  private _volume: number;

  constructor(volume: number) { this._volume = volume; }

  get volume() { return this._volume; }
  set volume(v: number) { this._volume = v; if (this.ctx) this.master.gain.setTargetAtTime(this.masterLevel(), this.ctx.currentTime, 0.05); }
  private masterLevel() { return Math.max(0, Math.min(1, this._volume)) * 0.9; }

  /** create (or resume) the audio graph; call from a user gesture on iOS */
  /** language for the voice lines */
  lang: 'nl' | 'en' = 'nl';
  /** mission won: a short cinematic sting with the radio voice over it ("Missie volbracht. Alle winkels zijn beveiligd.") */
  victory(voice = true): boolean {
    if (this._volume <= 0) return false; const c = this.ensure(); if (!c) return false;
    if (c.state === 'suspended') void c.resume();
    // not decoded yet (slow connection, or the first tap came late): fetch them now and play as soon as they are ready
    const vo = this.lang === 'en' ? 'vo_win_en' : 'vo_win_nl';
    if (!this.buf.has('win_sting') || (voice && !this.buf.has(vo))) {
      void Promise.all([this.loadOne(c, 'win_sting'), voice ? this.loadOne(c, vo) : Promise.resolve(true)]).then(([a, b]) => { if (a || b) this.playVictory(c, voice); });
      return true; // the recording follows; no synthesised chime on top
    }
    this.playVictory(c, voice); return true;
  }
  /** settings test: load the mission-end recordings and report which work (an error says why, e.g. 404) */
  async testVictory(): Promise<string> {
    if (this._volume <= 0) return 'volume is 0';
    const c = this.ensure(); if (!c) return 'no audio (AudioContext)';
    if (c.state === 'suspended') await c.resume().catch(() => {});
    const names = ['win_sting', this.lang === 'en' ? 'vo_win_en' : 'vo_win_nl'];
    const ok = await Promise.all(names.map((n) => this.loadOne(c, n)));
    this.playVictory(c, true);
    return names.map((n, i) => `${n}: ${ok[i] ? 'OK' : (this.loadErr.get(n) ?? 'not loaded')}`).join(' · ') + ` · audio ${c.state}`;
  }
  private loadErr = new Map<string, string>();
  private playVictory(c: Ctx, voice: boolean): boolean {
    // the sting through its own gain, so it can step back while the voice speaks
    const stingBus = c.createGain(); stingBus.gain.value = 1; stingBus.connect(this.out(this.ui, 0));
    const sting = this.smp('win_sting', stingBus, 0.95, { jitter: 0 });
    if (!voice) return sting;
    // the voice clear and loud on top (only the lowest rumble cut), the sting ducked to a third under it
    const at = sting ? 1.1 : 0; const t = c.currentTime; // after the fanfare's opening hit
    if (sting) { stingBus.gain.setValueAtTime(1, t + at - 0.15); stingBus.gain.linearRampToValueAtTime(0.35, t + at); stingBus.gain.setValueAtTime(0.35, t + at + 2.6); stingBus.gain.linearRampToValueAtTime(0.7, t + at + 3.1); }
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120;
    const vbus = c.createGain(); vbus.gain.value = 2.2; hp.connect(vbus).connect(this.out(this.ui, 0));
    const vo = this.smp(this.lang === 'en' ? 'vo_win_en' : 'vo_win_nl', hp, 1, { jitter: 0, delay: at });
    return sting || vo;
  }
  unlock() { const c = this.ensure(); if (c && c.state === 'suspended') void c.resume(); }

  private ensure(): Ctx | null {
    if (this.ctx || this._volume <= 0) return this.ctx;
    try { this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { this.ctx = null; return null; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master = c.createGain(); this.master.gain.value = this.masterLevel();
    this.ui = c.createGain(); this.ui.gain.value = 0.8;
    this.world = c.createGain(); this.world.gain.value = 1.4;
    this.amb = c.createGain(); this.amb.gain.value = 0.3;
    this.ui.connect(this.master); this.world.connect(this.master); this.amb.connect(this.master); this.master.connect(comp).connect(c.destination);
    // noise sources: white, pink (softer) and brown (rumble)
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate); this.pink = c.createBuffer(1, len, c.sampleRate); this.brown = c.createBuffer(1, len, c.sampleRate);
    const w = this.noise.getChannelData(0), p = this.pink.getChannelData(0), br = this.brown.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const x = Math.random() * 2 - 1; w[i] = x;
      b0 = 0.99765 * b0 + x * 0.099046; b1 = 0.963 * b1 + x * 0.2965164; b2 = 0.57 * b2 + x * 1.0526913; p[i] = (b0 + b1 + b2 + x * 0.1848) * 0.2;
      last = (last + 0.02 * x) / 1.02; br[i] = last * 3.5;
    }
    document.addEventListener('visibilitychange', this.onVis);
    this.loadSamples(c);
    return c;
  }
  private loading = new Map<string, Promise<boolean>>();
  /** load one recording (once); resolves true when it can be played */
  private loadOne(c: Ctx, name: string): Promise<boolean> {
    if (this.buf.has(name)) return Promise.resolve(true);
    let p = this.loading.get(name);
    if (!p) {
      p = fetch(`audio/${name}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((ab) => new Promise<AudioBuffer>((res, rej) => { const pr = c.decodeAudioData(ab, res, rej) as unknown as Promise<AudioBuffer> | undefined; pr?.catch?.(rej); }))
        .then((b) => {
          let peak = 0; for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, Math.abs(d[i])); }
          this.buf.set(name, { b, norm: peak > 0.01 ? 1 / peak : 1 }); return true;
        })
        .catch((e) => { console.warn('sound not loaded', name, e); this.loadErr.set(name, String(e)); this.loading.delete(name); return false; });
      this.loading.set(name, p);
    }
    return p;
  }
  private loadSamples(c: Ctx) {
    // the mission-end lines first, so they are always ready in time
    for (const n of ['win_sting', 'vo_win_nl', 'vo_win_en']) void this.loadOne(c, n);
    for (const name of Sfx.SAMPLES) void this.loadOne(c, name);
  }
  /** play a recorded sound; false when it is not loaded (caller synthesises instead) */
  private smp(name: string, dst: AudioNode, gain: number, opt: { rate?: number; jitter?: number; delay?: number } = {}): boolean {
    const e = this.buf.get(name); if (!e || !this.ctx) return false;
    const c = this.ctx; const src = c.createBufferSource(); src.buffer = e.b;
    src.playbackRate.value = (opt.rate ?? 1) * (1 + (Math.random() * 2 - 1) * (opt.jitter ?? 0.06)); // no two hits sound identical
    const g = c.createGain(); g.gain.value = gain * e.norm * Sfx.REC_LEVEL;
    src.connect(g).connect(dst); src.start(c.currentTime + (opt.delay ?? 0));
    return true;
  }
  /** a looping recording (two copies at slightly different speeds, so a short loop does not sound repetitive) */
  private loop(name: string, dst: AudioNode): GainNode | null {
    const have = this.loops.get(name); if (have) return have;
    const e = this.buf.get(name); if (!e || !this.ctx) return null;
    const c = this.ctx; const g = c.createGain(); g.gain.value = 0; g.connect(dst);
    for (const rate of [0.94, 1.07]) {
      const src = c.createBufferSource(); src.buffer = e.b; src.loop = true; src.playbackRate.value = rate;
      const sg = c.createGain(); sg.gain.value = e.norm * Sfx.LOOP_LEVEL; src.connect(sg).connect(g); src.start(0, Math.random() * e.b.duration);
    }
    this.loops.set(name, g); return g;
  }
  private onVis = () => { if (!this.ctx) return; if (document.hidden) void this.ctx.suspend(); else void this.ctx.resume(); };

  dispose() {
    document.removeEventListener('visibilitychange', this.onVis);
    if (this.ctx) void this.ctx.close();
    this.ctx = null; this.bed = null;
  }

  // ------------------------------------------------------------------ building blocks
  private out(bus: GainNode, pan: number) {
    const c = this.ctx!; const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(bus); return p;
  }
  /** an oscillator with an attack/decay envelope */
  private tone(dst: AudioNode, freq: number, dur: number, type: OscillatorType, gain: number, opt: { slide?: number; delay?: number; attack?: number; vibrato?: [number, number] } = {}) {
    const c = this.ctx!; const t = c.currentTime + (opt.delay ?? 0);
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + opt.slide), t + dur);
    if (opt.vibrato) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = opt.vibrato[0]; lg.gain.value = opt.vibrato[1]; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const a = opt.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dst); o.start(t); o.stop(t + dur + 0.05);
  }
  /** a filtered noise burst */
  private burst(dst: AudioNode, dur: number, gain: number, opt: { type?: BiquadFilterType; freq?: number; q?: number; to?: number; delay?: number; attack?: number; src?: AudioBuffer } = {}) {
    const c = this.ctx!; const t = c.currentTime + (opt.delay ?? 0);
    const s = c.createBufferSource(); s.buffer = opt.src ?? this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = opt.type ?? 'bandpass'; f.frequency.setValueAtTime(opt.freq ?? 1000, t); f.Q.value = opt.q ?? 0.8;
    if (opt.to) f.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
    const g = c.createGain(); const a = opt.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dst); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  private loopNoise(src: AudioBuffer, type: BiquadFilterType, freq: number, q: number, dst: AudioNode) {
    const c = this.ctx!; const s = c.createBufferSource(); s.buffer = src; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(dst); s.start(0, Math.random() * 1.5);
    return { g, f };
  }

  // ------------------------------------------------------------------ cues
  /** play a cue; `at` places it in the stereo field (from the view) */
  play(cue: Cue, at?: Listener) {
    if (this._volume <= 0) return;
    const c = this.ensure(); if (!c) return;
    if (c.state === 'suspended') void c.resume();
    const now = performance.now(); const key = cue + (at ? Math.round(at.pan * 4) : '');
    if ((this.last.get(key) ?? 0) > now - 60) return; this.last.set(key, now);
    const L = at ?? { pan: 0, gain: 1 };
    if (L.gain < 0.03) return;
    const isUi = cue === 'click' || cue === 'buy' || cue === 'deny' || cue === 'upgrade' || cue === 'place';
    const bus = isUi ? this.ui : this.world;
    const o = this.out(bus, L.pan); const g = L.gain;
    if (this.recorded(cue, o, g)) return;
    switch (cue) {
      // ---------- interface
      case 'click': this.tone(o, 1650, 0.035, 'sine', 0.22); this.burst(o, 0.02, 0.08, { type: 'highpass', freq: 4000 }); break;
      case 'buy': this.tone(o, 660, 0.09, 'triangle', 0.18); this.tone(o, 990, 0.14, 'triangle', 0.16, { delay: 0.06 }); this.burst(o, 0.05, 0.05, { type: 'highpass', freq: 6000, delay: 0.06 }); break;
      case 'place': this.burst(o, 0.12, 0.35, { type: 'lowpass', freq: 500, src: this.brown }); this.tone(o, 140, 0.12, 'sine', 0.25, { slide: -60 }); break;
      case 'deny': this.tone(o, 220, 0.12, 'square', 0.06); this.tone(o, 185, 0.16, 'square', 0.06, { delay: 0.1 }); break;
      case 'upgrade': [523, 659, 784].forEach((f, i) => this.tone(o, f, 0.22, 'triangle', 0.14, { delay: i * 0.07 })); this.burst(o, 0.3, 0.04, { type: 'highpass', freq: 5000, delay: 0.14 }); break;
      // ---------- world
      case 'intercept': // no whistle: just the scuffle of the push
        this.burst(o, 0.12, 0.25 * g, { type: 'lowpass', freq: 300, src: this.brown, delay: 0.05 }); // scuffle
        break;
      case 'held': this.burst(o, 0.18, 0.45 * g, { type: 'lowpass', freq: 380, src: this.brown }); this.tone(o, 95, 0.16, 'sine', 0.25 * g, { slide: -30 }); break;
      case 'glass': case 'breach': this.glass(o, g); if (cue === 'breach') this.thud(o, g * 0.8); break;
      case 'barrierBroken': this.thud(o, g); this.debris(o, g, 6); this.tone(o, 340, 0.4, 'triangle', 0.05 * g, { slide: -120, delay: 0.02 }); break;
      case 'impact': this.glass(o, g * 0.8); this.whoosh(o, g * 1.2, 0.05); break;
      case 'release': this.burst(o, 0.22, 0.12 * g, { type: 'bandpass', freq: 700, to: 2200, q: 1.2 }); break; // swing
      case 'fire': this.whoosh(o, g, 0); break;
      case 'extinguished': this.burst(o, 1.1, 0.28 * g, { type: 'highpass', freq: 2500, attack: 0.03 }); this.burst(o, 0.6, 0.15 * g, { type: 'lowpass', freq: 400, src: this.brown }); break;
      case 'collect': this.burst(o, 0.25, 0.14 * g, { type: 'bandpass', freq: 1800, q: 0.6 }); this.debris(o, g * 0.5, 2); break; // rustle and boxes
      case 'extract': this.burst(o, 0.2, 0.12 * g, { type: 'bandpass', freq: 1400, q: 0.7 }); this.tone(o, 1320, 0.25, 'triangle', 0.08 * g, { delay: 0.05 }); break;
      case 'recovered': this.tone(o, 880, 0.12, 'triangle', 0.1 * g); this.tone(o, 1175, 0.18, 'triangle', 0.1 * g, { delay: 0.08 }); break;
      case 'supply': // two-tone truck horn
        [[311, 0], [370, 0]].forEach(([f]) => { const lp = this.ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(o); this.tone(lp, f, 0.55, 'sawtooth', 0.07 * g, { attack: 0.02 }); });
        this.tone(o, 900, 0.18, 'triangle', 0.08, { delay: 0.6 }); this.tone(o, 1200, 0.25, 'triangle', 0.08, { delay: 0.72 }); // budget chime
        break;
      case 'dispatch': this.crowdShout(o, 1.2 * g); break;
      case 'gasThrow': this.tone(o, 90, 0.12, 'sine', 0.4 * g, { slide: -40 }); this.burst(o, 0.08, 0.35 * g, { type: 'lowpass', freq: 600, src: this.brown }); this.burst(o, 0.5, 0.1 * g, { type: 'bandpass', freq: 900, to: 2400, q: 1, delay: 0.05 }); break; // launcher thump + whoosh
      case 'gasLand': for (let i = 0; i < 3; i++) this.tone(o, rnd(1800, 2600), 0.06, 'triangle', 0.08 * g, { delay: i * 0.13 }); this.burst(o, 2.2, 0.22 * g, { type: 'highpass', freq: 3000, attack: 0.15, delay: 0.3 }); break; // clatter + hiss
      case 'strike': this.thud(o, g * 0.7); break;
      case 'scream': this.scream(o, g); break;
      case 'flashBang': // sharp crack, low thump and a ringing tone that fades (stun grenade)
        this.burst(o, 0.22, 0.95 * g, { type: 'highpass', freq: 900, attack: 0.002 });
        this.burst(o, 0.6, 0.8 * g, { type: 'lowpass', freq: 260, src: this.brown, attack: 0.003 });
        this.tone(o, 62, 0.45, 'sine', 0.55 * g, { slide: -30 });
        this.tone(o, 3700, 2.2, 'sine', 0.045 * g, { attack: 0.08, delay: 0.1 });
        break;
      case 'throwBack': for (let i = 0; i < 2; i++) this.tone(o, rnd(2000, 2900), 0.06, 'triangle', 0.07 * g, { delay: i * 0.1 }); this.crowdShout(o, 0.7 * g); break;
      case 'wave': this.crowdShout(o, 1.3); this.crowdShout(this.out(this.world, rnd(-0.6, 0.6)), 0.8); break;
      case 'win': this.stinger(o, [[523, 659, 784], [587, 740, 880], [659, 831, 988, 1319]], 0.13); break;
      case 'lose': this.stinger(o, [[392, 466, 587], [349, 415, 523], [262, 311, 392]], 0.13); break;
    }
  }

  /** recorded versions of the world cues (UI cues and music stingers stay synthesised) */
  private recorded(cue: Cue, o: AudioNode, g: number): boolean {
    const v = 0.5 * g;
    switch (cue) {
      case 'intercept': return this.smp('wood_hit', o, v * 0.35); // a dull shove, no whistle
      case 'held': return this.smp('shield', o, v);
      case 'glass': return this.smp('glass', o, v);
      case 'breach': { const a = this.smp('shutter', o, v * 0.7); const b = this.smp('glass', o, v * 0.6, { delay: 0.12 }); return a || b; }
      case 'barrierBroken': return this.smp('barrier', o, v);
      case 'impact': return this.smp('molotov', o, v);
      case 'fire': return this.smp('ignite', o, v);
      case 'extinguished': return this.smp('steam', o, v * 0.8);
      case 'collect': return this.smp('rustle', o, v * 0.6);
      case 'supply': if (!this.smp('horn', o, v * 0.8)) return false; this.tone(o, 900, 0.18, 'triangle', 0.08, { delay: 0.7 }); this.tone(o, 1200, 0.25, 'triangle', 0.08, { delay: 0.82 }); return true;
      case 'dispatch': return this.smp('crowd_shout', o, v * 0.7);
      case 'gasThrow': return this.smp('gas_launch', o, v * 0.9);
      case 'gasLand': { const a = this.smp('cough', o, v * 0.7, { delay: 1.2 }); const b = this.smp('scream', o, v * 0.6, { delay: 0.5 }); this.smp('gas_hiss', o, v * 0.5); return a || b; }
      case 'strike': return this.smp('baton', o, v * 0.9);
      case 'scream': return this.smp('scream', o, v * 0.7);
      case 'flashBang': { if (!this.smp('flashbang', o, v * 1.1)) return false; this.tone(o, 3700, 2.2, 'sine', 0.035 * g, { attack: 0.1, delay: 0.15 }); return true; } // recording plus a faint ear-ringing
      case 'throwBack': { const a = this.smp('riot_yell', o, v * 0.6, { jitter: 0.1 }); for (let i = 0; i < 2; i++) this.tone(o, rnd(2000, 2900), 0.06, 'triangle', 0.06 * g, { delay: 0.15 + i * 0.1 }); return a; }
      case 'wave': { // the riot starts: an angry roar rolls in, a bottle smashes somewhere
        const a = this.smp('riot_yell', this.out(this.world, rnd(-0.5, 0.5)), 0.3, { jitter: 0.05 }); const b = this.smp('crowd_shout', o, 0.22, { delay: 0.35 });
        this.smp('glass', this.out(this.world, rnd(-0.8, 0.8)), 0.12, { delay: rnd(0.8, 1.6) }); return a || b; }
      default: return false;
    }
  }

  private glass(o: AudioNode, g: number) {
    this.burst(o, 0.09, 0.55 * g, { type: 'highpass', freq: 2600 });
    this.burst(o, 0.5, 0.18 * g, { type: 'highpass', freq: 5200, attack: 0.002, delay: 0.03 });
    for (let i = 0; i < 9; i++) this.tone(o, rnd(2800, 7200), rnd(0.05, 0.18), 'sine', rnd(0.03, 0.08) * g, { delay: 0.04 + Math.random() * 0.45 }); // shards
  }
  private thud(o: AudioNode, g: number) {
    this.burst(o, 0.22, 0.7 * g, { type: 'lowpass', freq: 420, src: this.brown });
    this.tone(o, 110, 0.2, 'sine', 0.35 * g, { slide: -50 });
  }
  private debris(o: AudioNode, g: number, n: number) {
    for (let i = 0; i < n; i++) this.burst(o, rnd(0.03, 0.08), rnd(0.12, 0.3) * g, { type: 'bandpass', freq: rnd(500, 1600), q: 2, delay: 0.05 + Math.random() * 0.5 });
  }
  private whoosh(o: AudioNode, g: number, delay: number) {
    this.burst(o, 0.9, 0.45 * g, { type: 'bandpass', freq: 250, to: 1400, q: 0.7, attack: 0.08, delay });
    this.burst(o, 1.2, 0.35 * g, { type: 'lowpass', freq: 300, src: this.brown, attack: 0.1, delay });
  }
  private siren(o: AudioNode, g: number, dur: number) {
    // European two-tone, far away (low-passed)
    const lp = this.ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.connect(o);
    for (let i = 0; i < Math.floor(dur / 0.6); i++) this.tone(lp, i % 2 ? 440 : 587, 0.58, 'triangle', 0.05 * g, { delay: i * 0.6, attack: 0.04 });
  }
  private crowdShout(o: AudioNode, g: number) {
    // a short swell of many voices: formant-filtered noise with a fast vibrato-like flutter
    for (const [f, q] of [[480, 4], [950, 5], [2300, 6]] as const) this.burst(o, 1.1, 0.2 * g, { type: 'bandpass', freq: f, q, attack: 0.15, src: this.pink });
  }
  /** synthetic fallback: a few rising, wavering voices */
  private scream(o: AudioNode, g: number) {
    for (let i = 0; i < 3; i++) { const f = rnd(650, 1100); this.tone(o, f, rnd(0.5, 0.9), 'sawtooth', 0.02 * g, { slide: rnd(150, 400), vibrato: [rnd(6, 9), 25], attack: 0.05, delay: i * rnd(0.08, 0.2) }); }
  }
  private stinger(o: AudioNode, chords: number[][], gain: number) {
    chords.forEach((ch, i) => ch.forEach((f) => this.tone(o, f, i === chords.length - 1 ? 1.1 : 0.32, 'triangle', gain / ch.length * 1.6, { delay: i * 0.22, attack: 0.02 })));
  }

  // ------------------------------------------------------------------ ambience
  /** call every frame with the current state of the street */
  update(dt: number, s: AmbienceState) {
    if (this._volume <= 0 || !this.ctx) return;
    const c = this.ctx; const t = c.currentTime;
    if (!this.bed) {
      const crowd = this.loopNoise(this.pink, 'bandpass', 700, 0.9, this.amb);
      const hum = this.loopNoise(this.brown, 'lowpass', 220, 0.7, this.amb);
      const roarP = c.createStereoPanner(); roarP.connect(this.amb);
      const roar = this.loopNoise(this.brown, 'lowpass', 520, 0.8, roarP);
      const hissP = c.createStereoPanner(); hissP.connect(this.amb);
      const hiss = this.loopNoise(this.noise, 'highpass', 3200, 0.7, hissP);
      const waterP = c.createStereoPanner(); waterP.connect(this.amb);
      const water = this.loopNoise(this.pink, 'highpass', 1400, 0.5, waterP);
      this.bed = { crowd: crowd.g, crowdF: crowd.f, hum: hum.g, roar: roar.g, roarP, hiss: hiss.g, hissP, water: water.g, waterP };
    }
    const b = this.bed; const k = 0.4; // smoothing time constant (s)
    const quiet = s.paused ? 0.35 : 1;
    b.hum.gain.setTargetAtTime(0.16 * quiet, t, k);
    // crowd: grows with the number of rioters, with a slow irregular swell
    const crowdLvl = Math.min(1, s.crowd / 10) * (s.active ? 1 : 0.4);
    b.crowd.gain.setTargetAtTime((0.015 + crowdLvl * 0.16 * (0.8 + Math.sin(t * 0.7) * 0.12 + Math.sin(t * 1.9) * 0.08)) * quiet, t, k);
    b.crowdF.frequency.setTargetAtTime(600 + crowdLvl * 400, t, 1);
    // fire roar, placed at the loudest fire
    const loud = s.fires.reduce((a, f) => (f.gain > a.gain ? f : a), { pan: 0, gain: 0 });
    const fireLvl = Math.min(1, s.fires.reduce((a, f) => a + f.gain, 0));
    b.roar.gain.setTargetAtTime(fireLvl * 0.5 * quiet, t, k); b.roarP.pan.setTargetAtTime(loud.pan, t, k);
    // hose hiss
    const hose = s.hoses.reduce((a, f) => (f.gain > a.gain ? f : a), { pan: 0, gain: 0 });
    b.hiss.gain.setTargetAtTime(hose.gain * 0.12 * quiet, t, 0.12); b.hissP.pan.setTargetAtTime(hose.pan, t, 0.2);
    // fountain
    b.water.gain.setTargetAtTime((s.fountain?.gain ?? 0) * 0.035 * quiet, t, 0.8); b.waterP.pan.setTargetAtTime(s.fountain?.pan ?? 0, t, 0.8);
    // recorded loops where available: the synthesised bed underneath drops back to a thin layer
    const rec = (name: string, dst: AudioNode, level: number, synth: GainNode, synthLevel: number) => {
      const l = this.loop(name, dst); if (!l) return;
      l.gain.setTargetAtTime(level * quiet, t, k); synth.gain.setTargetAtTime(synthLevel * 0.25 * quiet, t, k);
    };
    rec('city_loop', this.amb, 0.5, b.hum, 0.16);
    // the long riot recording replaces the short crowd loop when present; panic layers on top when gas or chaos hits
    const panic = Math.min(1, s.panic ?? 0);
    if (this.buf.has('riot_loop')) { rec('riot_loop', this.amb, crowdLvl * 1.35 * (1 - panic * 0.3), b.crowd, 0.015 + crowdLvl * 0.16); const cl = this.loops.get('crowd_loop'); if (cl) cl.gain.setTargetAtTime(0, t, k); }
    else rec('crowd_loop', this.amb, crowdLvl * 0.7, b.crowd, 0.015 + crowdLvl * 0.16);
    { const l = this.loop('panic_loop', this.amb); if (l) l.gain.setTargetAtTime(panic * 1.3 * quiet, t, 0.6); }
    const gasL = (s.gas ?? []).reduce((a, f) => (f.gain > a.gain ? f : a), { pan: 0, gain: 0 });
    { const l = this.loop('gas_hiss', this.amb); if (l) l.gain.setTargetAtTime(gasL.gain * 0.35 * quiet, t, 0.4); }
    rec('fire_loop', b.roarP, fireLvl * 0.8, b.roar, fireLvl * 0.5);
    rec('hose_loop', b.hissP, hose.gain * 0.45, b.hiss, hose.gain * 0.12);
    // fire crew: water sizzling on the flames where the jet hits, the pump labouring at the engine, the nozzle opening
    { const l = this.loop('sizzle_loop', b.hissP); if (l) l.gain.setTargetAtTime(hose.gain * 0.5 * quiet, t, 0.15); }
    { const e = s.engine; if (!this.pumpP) { this.pumpP = c.createStereoPanner(); this.pumpP.connect(this.amb); }
      this.pumpP.pan.setTargetAtTime(e?.pan ?? 0, t, 0.3);
      const l = this.loop('pump_loop', this.pumpP); if (l) l.gain.setTargetAtTime((e && s.hoses.length ? e.gain * 0.35 : 0) * quiet, t, 0.8); }
    if (s.hoses.length > this.hosesBefore && !s.paused) this.smp('hose_charge', b.hissP, 0.7 * hose.gain);
    this.hosesBefore = s.hoses.length;
    if (s.engineArrived && s.engine && !s.paused) this.smp('engine_arrive', this.out(this.amb, s.engine.pan), 0.75 * s.engine.gain, { jitter: 0 });
    rec('fountain_loop', b.waterP, (s.fountain?.gain ?? 0) * 0.18, b.water, (s.fountain?.gain ?? 0) * 0.035);
    if (s.paused) return;
    // fire crackle: random pops, more with more fire
    this.crackleT -= dt;
    if (fireLvl > 0.02 && this.crackleT <= 0) {
      this.crackleT = rnd(0.03, 0.25) / (0.3 + fireLvl);
      const f = s.fires[Math.floor(Math.random() * s.fires.length)];
      if (f.gain > 0.03) this.burst(this.out(this.amb, f.pan + rnd(-0.1, 0.1)), rnd(0.01, 0.04), rnd(0.15, 0.5) * f.gain, { type: 'bandpass', freq: rnd(900, 4000), q: 1.5 });
    }
    // hammering on boards / barriers
    this.hammerT -= dt;
    if (s.hammering.length && this.hammerT <= 0) {
      this.hammerT = rnd(0.35, 0.7) / Math.min(3, s.hammering.length);
      const h = s.hammering[Math.floor(Math.random() * s.hammering.length)];
      if (h.gain > 0.03 && Math.random() < 0.55 && this.smp('smash', this.out(this.world, h.pan), 0.3 * h.gain, { jitter: 0.12 })) { /* crowbar on metal */ }
      else if (h.gain > 0.03 && this.smp('wood_hit', this.out(this.world, h.pan), 0.35 * h.gain, { jitter: 0.12 })) { /* recorded hit */ }
      else if (h.gain > 0.03) { const o = this.out(this.world, h.pan); this.burst(o, 0.09, 0.45 * h.gain, { type: 'bandpass', freq: rnd(350, 700), q: 1.3 }); this.tone(o, rnd(160, 220), 0.08, 'sine', 0.12 * h.gain, { slide: -60 }); }
    }
    // coughing from inside the gas, panicked screams when the crowd breaks, angry yells while they smash
    if (s.active) {
      this.coughT -= dt;
      if (gasL.gain > 0.05 && this.coughT <= 0) { this.coughT = rnd(2.5, 5); const o = this.out(this.amb, gasL.pan + rnd(-0.2, 0.2)); if (!this.smp('cough', o, 0.3 * gasL.gain, { jitter: 0.1 })) for (let i = 0; i < 4; i++) this.burst(o, 0.12, 0.12 * gasL.gain, { type: 'bandpass', freq: rnd(500, 900), q: 2, delay: i * rnd(0.18, 0.3) }); }
      this.screamT -= dt;
      if (panic > 0.15 && this.screamT <= 0) { this.screamT = rnd(3, 7) / (0.5 + panic); const o = this.out(this.amb, rnd(-0.7, 0.7)); if (!this.smp('scream', o, 0.2 + panic * 0.25, { jitter: 0.12 })) this.scream(o, 0.5 + panic); }
      this.yellT -= dt;
      const angry = (s.smashing ?? 0) + s.crowd * 0.3;
      if (angry > 1 && this.yellT <= 0) { this.yellT = rnd(4, 9) / Math.min(2.5, angry / 3); this.smp('riot_yell', this.out(this.amb, rnd(-0.8, 0.8)), 0.2 + Math.min(0.3, angry / 30), { jitter: 0.1 }); }
    }
    // distant sirens and occasional shouts while a wave runs
    if (s.active) {
      this.sirenT -= dt;
      if (this.sirenT <= 0 && this.smp('siren', this.out(this.amb, rnd(-0.9, 0.9)), 0.16, { jitter: 0.04 })) this.sirenT = rnd(35, 70); // far away, now and then
      else if (this.sirenT <= 0) { this.sirenT = rnd(35, 70); this.siren(this.out(this.amb, rnd(-0.9, 0.9)), 0.2, rnd(2.4, 4.2)); }
      this.shoutT -= dt;
      if (s.crowd > 2 && this.shoutT <= 0) { this.shoutT = rnd(3, 8) / Math.min(2, s.crowd / 5); if (!this.smp('crowd_shout', this.out(this.amb, rnd(-0.7, 0.7)), 0.25 + Math.min(0.4, s.crowd / 25))) this.crowdShout(this.out(this.amb, rnd(-0.7, 0.7)), 0.25 + Math.min(0.5, s.crowd / 20)); }
    }
  }
}
