/* First-time walkthrough: the game pauses, the screen dims except for one part of it (a spotlight), and a card next to
 * it says what that part is and how to use it. Next / Skip; a tap on the dimmed area also goes on. One tour per side,
 * shown the first time that side is played (Settings has a button to see it again). */

export interface WStep {
  /** what to light up (a rectangle on screen); null: no spotlight, the card in the middle */
  at?: () => DOMRect | null;
  title: string;
  text: string;
}

/** the rectangle around several elements (those not on the page are ignored) */
export function around(...els: (Element | null | undefined)[]): DOMRect | null {
  const rs = els.filter((e): e is Element => !!e && (e as HTMLElement).offsetParent !== null).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rs.length) return null;
  const x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top)), x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom));
  return new DOMRect(x0, y0, x1 - x0, y1 - y0);
}

export function runWalkthrough(steps: WStep[], en: boolean, done: () => void): () => void {
  const root = document.createElement('div'); root.className = 'wt';
  root.innerHTML = `<div class="wt-dim"></div><div class="wt-hole"></div><div class="wt-card" role="dialog" aria-live="polite">
    <small class="wt-n"></small><h3></h3><p></p>
    <div class="wt-btns"><button class="wt-skip">${en ? 'Skip' : 'Overslaan'}</button><button class="wt-next primary"></button></div></div>`;
  document.body.appendChild(root);
  const hole = root.querySelector<HTMLDivElement>('.wt-hole')!, dim = root.querySelector<HTMLDivElement>('.wt-dim')!, card = root.querySelector<HTMLDivElement>('.wt-card')!;
  let i = 0; let closed = false;
  const layout = () => {
    const s = steps[i]; const r = s.at?.() ?? null; const W = window.innerWidth, H = window.innerHeight; const pad = 6;
    card.querySelector('.wt-n')!.textContent = `${i + 1} / ${steps.length}`;
    card.querySelector('h3')!.textContent = s.title;
    card.querySelector('p')!.textContent = s.text;
    card.querySelector('.wt-next')!.textContent = i === steps.length - 1 ? (en ? "Let's play!" : 'Spelen!') : (en ? 'Next →' : 'Volgende →');
    const cw = Math.min(W >= 700 && H >= 700 ? 440 : 360, W - 24); card.style.width = `${cw}px`; // tablets and desktops: a little larger
    if (!r) {
      hole.style.display = 'none'; dim.style.display = 'block';
      card.style.left = `${(W - cw) / 2}px`; card.style.top = ''; card.style.bottom = ''; card.style.top = `${Math.max(12, H / 2 - card.offsetHeight / 2)}px`;
      return;
    }
    dim.style.display = 'none'; hole.style.display = 'block';
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad), w = Math.min(W - 8, r.width + pad * 2), h = Math.min(H - 8, r.height + pad * 2);
    Object.assign(hole.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    // the card goes where there is more room: under the spotlight or above it
    const below = H - (y + h), above = y;
    card.style.left = `${Math.max(12, Math.min(W - cw - 12, x + w / 2 - cw / 2))}px`;
    if (below >= above) { card.style.top = `${Math.min(H - card.offsetHeight - 12, y + h + 12)}px`; card.style.bottom = ''; }
    else { card.style.top = ''; card.style.bottom = `${Math.min(H - card.offsetHeight - 12, H - y + 12)}px`; }
  };
  const close = () => { if (closed) return; closed = true; window.removeEventListener('resize', onResize); root.classList.add('out'); setTimeout(() => root.remove(), 250); done(); };
  const next = () => { if (i >= steps.length - 1) { close(); return; } i++; layout(); };
  const onResize = () => layout();
  card.querySelector('.wt-next')!.addEventListener('click', (e) => { e.stopPropagation(); next(); });
  card.querySelector('.wt-skip')!.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  card.addEventListener('click', (e) => e.stopPropagation());
  root.addEventListener('click', next); // a tap on the dimmed street goes on too
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  window.addEventListener('resize', onResize);
  requestAnimationFrame(layout);
  return close;
}
