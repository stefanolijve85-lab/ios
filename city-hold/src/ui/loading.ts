import { ASSET_Q } from '../assetVer';
/** loading screen: the riot film (muted, looping) behind the loading line; the poster shows until the film plays */
export function loadingInner(text: string): string {
  return `<video class="rm-loadvid" src="menu/loading.mp4${ASSET_Q}" poster="menu/loading_poster.jpg" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>
    <div class="rm-loadshade"></div><span data-l>${text}</span><i class="rm-loadbar"></i>`;
}
/** iOS sometimes ignores autoplay on an element added with innerHTML: start it explicitly */
export function startLoadingFilm(root: ParentNode) {
  const v = root.querySelector<HTMLVideoElement>('.rm-loadvid'); if (!v) return;
  v.muted = true; v.playsInline = true; void v.play().catch(() => { /* the poster stays */ });
}
