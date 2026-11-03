import { ASSET_Q } from '../assetVer';
/** where the film was when the previous loading screen closed: the next one continues from there instead of restarting */
let lastTime = 0;
/** fetch the film in the background while the player is still in the menus, so it plays at once when loading starts */
let warmed = false;
export function warmLoadingFilm() { if (warmed) return; warmed = true; try { void fetch(`menu/loading.mp4${ASSET_Q}`).catch(() => {}); } catch { /* ignore */ } }

/** loading screen: the whole riot film (letterboxed, never cropped) over a blurred copy of its first frame; the still
 *  frame shows at once, the film fades in as soon as it actually plays */
export function loadingInner(text: string): string {
  return `<div class="rm-loadbg"></div>
    <video class="rm-loadvid" src="menu/loading.mp4${ASSET_Q}" poster="menu/loading_poster.jpg" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>
    <div class="rm-loadshade"></div><span data-l>${text}</span><i class="rm-loadbar"></i>`;
}
/** iOS sometimes ignores autoplay on an element added with innerHTML: start it explicitly, continuing where it was */
export function startLoadingFilm(root: ParentNode) {
  const v = root.querySelector<HTMLVideoElement>('.rm-loadvid'); if (!v) return;
  v.muted = true; v.playsInline = true;
  const go = () => { if (lastTime > 0 && v.duration) v.currentTime = lastTime % v.duration; void v.play().catch(() => { /* the still frame stays */ }); };
  if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  v.addEventListener('playing', () => v.classList.add('on'), { once: true });
  v.addEventListener('timeupdate', () => { lastTime = v.currentTime; });
}
