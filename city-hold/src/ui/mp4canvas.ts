/* Plays a (silent, H.264, fast-start) MP4 on a canvas with WebCodecs. Used for the intro when the phone refuses to
 * start a <video> by itself: iOS in Low Power Mode blocks every autoplaying video, muted or not, until a tap. Decoding
 * frames and drawing them is not "playing a video", so it is not blocked. Only what our own intro file needs is read:
 * one video track, avc1, sample tables in the moov box. */

interface Sample { off: number; size: number; dts: number; cts: number; key: boolean }
interface Track { codec: string; desc: Uint8Array; w: number; h: number; scale: number; samples: Sample[]; duration: number }

function boxes(d: DataView, start: number, end: number): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>(); let i = start;
  while (i + 8 <= end) {
    let size = d.getUint32(i); const type = String.fromCharCode(d.getUint8(i + 4), d.getUint8(i + 5), d.getUint8(i + 6), d.getUint8(i + 7));
    let head = 8; if (size === 1) { size = Number(d.getBigUint64(i + 8)); head = 16; } else if (size === 0) size = end - i;
    if (size < head) break;
    if (!out.has(type)) out.set(type, [i + head, i + size]);
    i += size;
  }
  return out;
}

function parse(buf: ArrayBuffer): Track | null {
  const d = new DataView(buf); const top = boxes(d, 0, buf.byteLength); const moov = top.get('moov'); if (!moov) return null;
  for (const [type, [s, e]] of [...boxesAll(d, moov[0], moov[1])]) {
    if (type !== 'trak') continue;
    const mdia = boxes(d, s, e).get('mdia'); if (!mdia) continue;
    const mb = boxes(d, mdia[0], mdia[1]); const hdlr = mb.get('hdlr'); const mdhd = mb.get('mdhd'); const minf = mb.get('minf');
    if (!hdlr || !mdhd || !minf) continue;
    const handler = String.fromCharCode(d.getUint8(hdlr[0] + 8), d.getUint8(hdlr[0] + 9), d.getUint8(hdlr[0] + 10), d.getUint8(hdlr[0] + 11));
    if (handler !== 'vide') continue;
    const v1 = d.getUint8(mdhd[0]) === 1; const scale = d.getUint32(mdhd[0] + (v1 ? 20 : 12));
    const stblR = boxes(d, minf[0], minf[1]).get('stbl'); if (!stblR) return null;
    const st = boxes(d, stblR[0], stblR[1]);
    // sample description: avc1 -> avcC
    const stsd = st.get('stsd')!; const entry = stsd[0] + 8; const fmt = String.fromCharCode(d.getUint8(entry + 4), d.getUint8(entry + 5), d.getUint8(entry + 6), d.getUint8(entry + 7));
    if (fmt !== 'avc1' && fmt !== 'avc3') return null;
    const w = d.getUint16(entry + 8 + 24), h = d.getUint16(entry + 8 + 26);
    const inner = boxes(d, entry + 8 + 78, entry + d.getUint32(entry)); const avcC = inner.get('avcC'); if (!avcC) return null;
    const desc = new Uint8Array(buf.slice(avcC[0], avcC[1]));
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    const codec = `avc1.${hex(desc[1])}${hex(desc[2])}${hex(desc[3])}`;
    // sizes, chunk offsets, samples per chunk, decode times, composition offsets, sync samples
    const stsz = st.get('stsz')!; const fixed = d.getUint32(stsz[0] + 4); const n = d.getUint32(stsz[0] + 8);
    const sizes: number[] = []; for (let i = 0; i < n; i++) sizes.push(fixed || d.getUint32(stsz[0] + 12 + i * 4));
    const offs: number[] = []; const stco = st.get('stco'), co64 = st.get('co64');
    if (stco) { const c = d.getUint32(stco[0] + 4); for (let i = 0; i < c; i++) offs.push(d.getUint32(stco[0] + 8 + i * 4)); }
    else if (co64) { const c = d.getUint32(co64[0] + 4); for (let i = 0; i < c; i++) offs.push(Number(d.getBigUint64(co64[0] + 8 + i * 8))); }
    const stsc = st.get('stsc')!; const sc: [number, number][] = []; { const c = d.getUint32(stsc[0] + 4); for (let i = 0; i < c; i++) sc.push([d.getUint32(stsc[0] + 8 + i * 12), d.getUint32(stsc[0] + 12 + i * 12)]); }
    const dts: number[] = []; { const stts = st.get('stts')!; const c = d.getUint32(stts[0] + 4); let t = 0; for (let i = 0; i < c; i++) { const cnt = d.getUint32(stts[0] + 8 + i * 8), del = d.getUint32(stts[0] + 12 + i * 8); for (let k = 0; k < cnt; k++) { dts.push(t); t += del; } } }
    const cto: number[] = new Array(n).fill(0); { const ctts = st.get('ctts'); if (ctts) { const ver = d.getUint8(ctts[0]); const c = d.getUint32(ctts[0] + 4); let j = 0; for (let i = 0; i < c; i++) { const cnt = d.getUint32(ctts[0] + 8 + i * 8); const o = ver ? d.getInt32(ctts[0] + 12 + i * 8) : d.getUint32(ctts[0] + 12 + i * 8); for (let k = 0; k < cnt && j < n; k++) cto[j++] = o; } } }
    const keys = new Set<number>(); const stss = st.get('stss'); if (stss) { const c = d.getUint32(stss[0] + 4); for (let i = 0; i < c; i++) keys.add(d.getUint32(stss[0] + 8 + i * 4) - 1); }
    const samples: Sample[] = []; let si = 0;
    for (let ci = 0; ci < offs.length; ci++) {
      let per = sc[0][1]; for (const [first, cnt] of sc) if (ci + 1 >= first) per = cnt;
      let o = offs[ci];
      for (let k = 0; k < per && si < n; k++, si++) { samples.push({ off: o, size: sizes[si], dts: dts[si] ?? 0, cts: (dts[si] ?? 0) + cto[si], key: stss ? keys.has(si) : true }); o += sizes[si]; }
    }
    const minCts = Math.min(...samples.map((s) => s.cts)); for (const s of samples) { s.cts -= minCts; }
    const duration = Math.max(...samples.map((s) => s.cts)) / scale;
    return { codec, desc, w, h, scale, samples, duration };
  }
  return null;
}
function boxesAll(d: DataView, start: number, end: number): [string, [number, number]][] {
  const out: [string, [number, number]][] = []; let i = start;
  while (i + 8 <= end) { const size = d.getUint32(i); if (size < 8) break; out.push([String.fromCharCode(d.getUint8(i + 4), d.getUint8(i + 5), d.getUint8(i + 6), d.getUint8(i + 7)), [i + 8, i + size]]); i += size; }
  return out;
}

/** true when this browser can decode H.264 with WebCodecs */
export function canvasVideoSupported(): boolean { return typeof (window as unknown as { VideoDecoder?: unknown }).VideoDecoder === 'function'; }

/** play `url` on `canvas`; resolves to a stop function, or null when it cannot (no WebCodecs, unsupported file) */
export async function playOnCanvas(url: string, canvas: HTMLCanvasElement, onEnd: () => void): Promise<(() => void) | null> {
  if (!canvasVideoSupported()) return null;
  let buf: ArrayBuffer; try { buf = await (await fetch(url)).arrayBuffer(); } catch { return null; }
  const tr = parse(buf); if (!tr || !tr.samples.length) return null;
  const VD = (window as unknown as { VideoDecoder: typeof VideoDecoder }).VideoDecoder;
  const cfg: VideoDecoderConfig = { codec: tr.codec, description: tr.desc, codedWidth: tr.w, codedHeight: tr.h };
  try { const ok = await VD.isConfigSupported(cfg); if (!ok.supported) return null; } catch { return null; }
  canvas.width = tr.w; canvas.height = tr.h; const ctx = canvas.getContext('2d'); if (!ctx) return null;
  const frames: VideoFrame[] = []; let failed = false; let stopped = false;
  const dec = new VD({ output: (f) => { if (stopped) { f.close(); return; } frames.push(f); frames.sort((a, b) => a.timestamp - b.timestamp); }, error: () => { failed = true; } });
  dec.configure(cfg);
  let next = 0; let flushed = false; let t0 = 0; let lastTs = -1; let raf = 0;
  const us = (t: number) => Math.round((t / tr.scale) * 1e6);
  const feed = () => {
    // a few frames ahead only: phones run out of decoder memory when frames are held
    while (next < tr.samples.length && frames.length + dec.decodeQueueSize < 8) {
      const s = tr.samples[next++];
      dec.decode(new EncodedVideoChunk({ type: s.key ? 'key' : 'delta', timestamp: us(s.cts), duration: us(tr.scale / 30), data: new Uint8Array(buf, s.off, s.size) }));
    }
    if (next >= tr.samples.length && !flushed) { flushed = true; void dec.flush().catch(() => {}); }
  };
  const stop = () => { if (stopped) return; stopped = true; cancelAnimationFrame(raf); for (const f of frames) f.close(); frames.length = 0; try { dec.close(); } catch { /* closed */ } };
  const tick = (now: number) => {
    if (stopped) return;
    if (failed) { stop(); onEnd(); return; }
    feed();
    if (!t0 && frames.length) t0 = now; // the clock starts with the first decoded frame
    if (t0) {
      const el = (now - t0) * 1000; // microseconds since start
      let show: VideoFrame | null = null;
      while (frames.length && frames[0].timestamp <= el) { if (show) show.close(); show = frames.shift()!; }
      if (show) { ctx.drawImage(show, 0, 0, tr.w, tr.h); lastTs = show.timestamp; show.close(); }
      if (flushed && !frames.length && dec.decodeQueueSize === 0 && el / 1e6 > tr.duration && lastTs >= 0) { stop(); onEnd(); return; }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return stop;
}
