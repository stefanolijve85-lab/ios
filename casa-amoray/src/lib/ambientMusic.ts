"use client";

/**
 * Rustige achtergrondmuziek via Web Audio:
 * - start alleen na een tik van de bezoeker (browsers blokkeren automatisch afspelen);
 * - naadloze lus (AudioBufferSourceNode.loop) en zacht in-/uitfaden (GainNode);
 *   met een <audio>-element kan het volume op iOS niet geregeld worden;
 * - speelt ook als de iPhone op stil staat (audioSession 'playback'), want de
 *   bezoeker heeft er zelf om gevraagd;
 * - pauzeert als de pagina verborgen is, en gaat verder als je terugkomt;
 * - het bestand wordt pas geladen bij de eerste keer aanzetten.
 */

const SRC = "/media/audio/spa-ambient.m4a";
const VOLUME = 0.32;
const KEY = "ca-music";

type Listener = (on: boolean) => void;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let buffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let loading: Promise<AudioBuffer> | null = null;
let on = false;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l(on));

export function subscribe(l: Listener) {
  listeners.add(l);
  l(on);
  return () => listeners.delete(l);
}

export const isOn = () => on;

export function wantsMusic() {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function remember(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "on" : "off");
  } catch {
    /* privémodus: niet onthouden */
  }
}

function ensureContext() {
  if (ctx) return ctx;
  // iOS 16.4+: negeer de stilteschakelaar (de bezoeker zette de muziek zelf aan).
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* niet ondersteund */
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  return ctx;
}

function load() {
  if (!loading) {
    loading = fetch(SRC)
      .then((r) => {
        if (!r.ok) throw new Error(`Muziek laden mislukt (${r.status})`);
        return r.arrayBuffer();
      })
      .then((data) => new Promise<AudioBuffer>((res, rej) => ctx!.decodeAudioData(data, res, rej)))
      .then((b) => (buffer = b));
    loading.catch(() => (loading = null));
  }
  return loading;
}

function fadeTo(target: number, seconds: number) {
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(target, now + seconds);
}

/** Moet vanuit een tik/klik worden aangeroepen (gebruikersactie). */
export async function start() {
  const c = ensureContext(); // synchroon binnen de tik: vereist door iOS
  on = true;
  remember(true);
  emit();
  if (c.state !== "running") await c.resume().catch(() => undefined);
  try {
    await load();
  } catch {
    on = false;
    emit();
    return;
  }
  if (!on) return; // intussen weer uitgezet
  if (!source) {
    source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain!);
    source.start();
  }
  fadeTo(VOLUME, 2.5);
}

export function stop() {
  on = false;
  remember(false);
  emit();
  fadeTo(0, 1.2);
  window.setTimeout(() => {
    if (!on) ctx?.suspend().catch(() => undefined);
  }, 1300);
}

export function toggle() {
  return on ? stop() : start();
}

// Pagina verborgen (andere app/tab): zacht stil; terug: zacht verder.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    if (document.hidden) {
      fadeTo(0, 0.4);
      window.setTimeout(() => document.hidden && ctx?.suspend().catch(() => undefined), 450);
    } else {
      ctx.resume().then(() => fadeTo(VOLUME, 1.5)).catch(() => undefined);
    }
  });
}
