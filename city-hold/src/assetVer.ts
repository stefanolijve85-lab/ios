declare const __ASSET_VER__: string;
/** query suffix for sound and model files: changes with every build, so iPad Safari fetches updated files instead of its cached copy */
export const ASSET_Q = typeof __ASSET_VER__ !== 'undefined' ? `?v=${__ASSET_VER__}` : '';
