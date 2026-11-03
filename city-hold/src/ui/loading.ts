import { ASSET_Q } from '../assetVer';

/* The loading film (menu/loading.mp4) is one <video> element for the whole session. It is created and downloaded
 * as soon as the page opens (during the intro), kept as an in-memory blob, and moved into each loading screen, so it
 * starts on the first frame without waiting for the network. The first tap anywhere "unlocks" it for iPad/iPhone,
 * which otherwise may refuse to play a video that was not started from a tap (Low Power mode). */
const SRC = `menu/loading.mp4${ASSET_Q}`;
let film: HTMLVideoElement | null = null;
let warmed = false;

function filmEl(): HTMLVideoElement {
  if (film) return film;
  const v = document.createElement('video');
  v.className = 'rm-loadvid';
  v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = false;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  v.preload = 'auto'; v.poster = 'menu/loading_poster.jpg'; v.src = SRC;
  // a loading screen that was replaced leaves the film detached: stop decoding it
  v.addEventListener('timeupdate', () => { if (!v.isConnected) v.pause(); });
  film = v;
  return v;
}

export function warmLoadingFilm() {
  if (warmed) return; warmed = true;
  const v = filmEl();
  try { v.load(); } catch { /* ignore */ }
  try {
    void fetch(SRC).then((r) => (r.ok ? r.blob() : null)).then((b) => {
      if (!b || v.isConnected) return; // never swap the source under a playing loading screen
      v.src = URL.createObjectURL(b); v.load();
    }).catch(() => {});
  } catch { /* ignore */ }
  const unlock = () => {
    if (v.isConnected) return;
    void v.play().then(() => { if (!v.isConnected) v.pause(); }).catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { capture: true, once: true });
}

export function loadingInner(text: string): string {
  return `<div class="rm-loadbg"></div><i class="rm-loadslot"></i>
    <div class="rm-loadshade"></div><span data-l>${text}</span><i class="rm-loadbar"></i>`;
}

/** put the (already downloaded) film into a loading screen and play it; call it from the tap handler if possible */
export function startLoadingFilm(root: ParentNode) {
  warmLoadingFilm();
  const slot = root.querySelector('.rm-loadslot'); if (!slot) return;
  const v = filmEl();
  slot.replaceWith(v);
  void v.play().catch(() => { /* blocked: the sharp poster frame stays */ });
}
