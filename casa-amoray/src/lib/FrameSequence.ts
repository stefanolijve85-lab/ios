import { frameUrl, type SequenceEntry, type SequenceVariant } from "@/content/scenes";

/**
 * Tekent een beeldreeks op een <canvas>, gestuurd door een voortgang 0..1.
 *
 * - Kiest automatisch de staande (mobiel) of liggende (desktop) reeks.
 * - Laadt progressief: eerst een grove verdeling van frames, daarna de
 *   tussenliggende. Zo werkt scrubben al vóór alles binnen is (er wordt het
 *   dichtstbijzijnde geladen frame getoond).
 * - Tekent alleen in requestAnimationFrame en alleen als het frame verandert.
 * - `unload()` geeft het geheugen vrij als de scène ver buiten beeld is.
 */
export class FrameSequence {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entry: SequenceEntry;
  private variant!: SequenceVariant;
  private frames: (HTMLImageElement | null)[] = [];
  private requested = new Set<number>();
  private target = 0;
  private drawn = -1;
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
      this.drawn = -1;
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
      img.onload = () => {
        if (token !== this.loadingToken) return;
        this.frames[i] = img;
        if (i === 0) this.onFirstFrame?.();
        // Opnieuw tekenen als dit frame dichter bij het doel ligt
        if (Math.abs(i - this.target) < Math.abs(this.drawn - this.target) || this.drawn < 0) {
          this.drawn = -1;
          this.schedule();
        }
        next();
      };
      img.onerror = () => next();
      img.src = this.src(i);
    };
    for (let k = 0; k < concurrency; k++) next();
  }

  unload() {
    this.loadingToken++;
    this.frames = this.frames.map(() => null);
    this.requested.clear();
    this.drawn = -1;
  }

  setProgress(p: number) {
    const n = this.variant.frames;
    this.target = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
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

  private draw() {
    const idx = this.nearestLoaded(this.target);
    if (idx < 0 || idx === this.drawn) return;
    const img = this.frames[idx]!;
    const { width: cw, height: ch } = this.canvas;
    // object-fit: cover
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    this.drawn = idx;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.unload();
  }
}
