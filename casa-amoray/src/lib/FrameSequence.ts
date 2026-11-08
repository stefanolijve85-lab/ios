import { frameUrl, type SequenceEntry, type SequenceVariant } from "@/content/scenes";

/**
 * Tekent een beeldreeks op een <canvas>, gestuurd door een voortgang 0..1.
 *
 * - Kiest automatisch de staande (mobiel) of liggende (desktop) reeks.
 * - Laadt progressief: eerst een grove verdeling van frames, daarna de
 *   tussenliggende. Zo werkt scrubben al vóór alles binnen is (er wordt het
 *   dichtstbijzijnde geladen frame getoond).
 * - Vloeiend: tussen twee frames wordt overgevloeid op basis van de exacte
 *   scrollpositie, zodat er geen zichtbare 'stapjes' zijn.
 * - Frames worden vooraf gedecodeerd (img.decode), zodat tekenen niet hapert.
 * - Tekent alleen in requestAnimationFrame en alleen als de positie verandert.
 * - `unload()` geeft het geheugen vrij als de scène ver buiten beeld is.
 */
export class FrameSequence {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entry: SequenceEntry;
  private variant!: SequenceVariant;
  private frames: (HTMLImageElement | null)[] = [];
  private requested = new Set<number>();
  /** Gewenste positie in frames, met fractie (bv. 12.4). */
  private pos = 0;
  /** Sleutel van wat er nu op het canvas staat, om dubbel tekenen te voorkomen. */
  private drawnKey = "";
  private raf = 0;
  private loadingToken = 0;
  private onFirstFrame?: () => void;

  constructor(canvas: HTMLCanvasElement, entry: SequenceEntry, onFirstFrame?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.entry = entry;
    this.onFirstFrame = onFirstFrame;
    this.pickVariant();
    this.resize();
  }

  get frameCount() {
    return this.variant.frames;
  }

  /** Staand scherm -> mobiele compositie, liggend -> desktopcompositie. */
  pickVariant() {
    const landscape = window.matchMedia("(min-aspect-ratio: 1/1)").matches;
    const next = (landscape ? this.entry.desktop ?? this.entry.mobile : this.entry.mobile ?? this.entry.desktop)!;
    if (next !== this.variant) {
      this.variant = next;
      this.unload();
      this.frames = new Array(next.frames).fill(null);
      return true;
    }
    return false;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w && h && (w !== this.canvas.width || h !== this.canvas.height)) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.drawnKey = "";
      this.schedule();
    }
  }

  src(i: number) {
    return frameUrl(this.variant, i);
  }

  /** Volgorde: eerste, laatste, dan steeds fijnere tussenstappen. */
  private loadOrder() {
    const n = this.variant.frames;
    const order: number[] = [0, n - 1];
    for (let step = 16; step >= 1; step = step / 2) {
      for (let i = 0; i < n; i += step) order.push(i);
    }
    return Array.from(new Set(order));
  }

  load(concurrency = 4) {
    const token = ++this.loadingToken;
    const queue = this.loadOrder().filter((i) => !this.requested.has(i));
    const next = () => {
      if (token !== this.loadingToken) return;
      const i = queue.shift();
      if (i === undefined) return;
      this.requested.add(i);
      const img = new Image();
      img.decoding = "async";
      img.src = this.src(i);
      // Eerst volledig decoderen; pas dan telt het frame als 'geladen'.
      img
        .decode()
        .catch(() => undefined)
        .then(() => {
          if (token !== this.loadingToken || !img.naturalWidth) return next();
          this.frames[i] = img;
          if (i === 0) this.onFirstFrame?.();
          // Opnieuw tekenen als dit frame rond de huidige positie ligt
          if (Math.abs(i - this.pos) < 2 || !this.drawnKey) {
            this.drawnKey = "";
            this.schedule();
          }
          next();
        });
    };
    for (let k = 0; k < concurrency; k++) next();
  }

  unload() {
    this.loadingToken++;
    this.frames = this.frames.map(() => null);
    this.requested.clear();
    this.drawnKey = "";
  }

  setProgress(p: number) {
    const n = this.variant.frames;
    this.pos = Math.min(n - 1, Math.max(0, p * (n - 1)));
    this.schedule();
  }

  private schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  }

  private nearestLoaded(i: number) {
    for (let d = 0; d < this.frames.length; d++) {
      if (this.frames[i - d]) return i - d;
      if (this.frames[i + d]) return i + d;
    }
    return -1;
  }

  private paint(img: HTMLImageElement, alpha: number) {
    const { width: cw, height: ch } = this.canvas;
    // object-fit: cover
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    this.ctx.globalAlpha = 1;
  }

  private draw() {
    const i0 = Math.floor(this.pos);
    const i1 = Math.min(i0 + 1, this.frames.length - 1);
    // Afronden op 1/32 frame: kleiner verschil is niet zichtbaar.
    const f = Math.round((this.pos - i0) * 32) / 32;
    const a = this.frames[i0];
    const b = this.frames[i1];
    if (a && b) {
      const key = `${i0}:${f}`;
      if (key === this.drawnKey) return;
      this.paint(a, 1);
      if (f > 0 && i1 !== i0) this.paint(b, f); // overvloeien naar het volgende frame
      this.drawnKey = key;
      return;
    }
    // Nog niet alles geladen: toon het dichtstbijzijnde frame.
    const idx = this.nearestLoaded(Math.round(this.pos));
    if (idx < 0) return;
    const key = `n${idx}`;
    if (key === this.drawnKey) return;
    this.paint(this.frames[idx]!, 1);
    this.drawnKey = key;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.unload();
  }
}
