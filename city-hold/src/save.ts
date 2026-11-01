// Local progress and settings (localStorage). Explicit reset is available from the menu.
export interface Settings { volume: number; reducedFx: boolean; showHints: boolean }
export interface Progress {
  version: 1;
  unlocked: string[];
  completed: Record<string, { defence?: boolean; looters?: boolean }>;
  research: number;
  perks: string[];
  tutorialDone: boolean;
  matches: number;
  settings: Settings;
}

const KEY = 'cityhold.progress.v1';

export function defaultProgress(): Progress {
  return { version: 1, unlocked: ['paris'], completed: {}, research: 0, perks: [], tutorialDone: false, matches: 0, settings: { volume: 0.6, reducedFx: false, showHints: true } };
}

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
function store(): StorageLike | null { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } }

export function loadProgress(s: StorageLike | null = store()): Progress {
  const d = defaultProgress();
  if (!s) return d;
  try {
    const raw = s.getItem(KEY); if (!raw) return d;
    const p = JSON.parse(raw) as Partial<Progress>;
    if (p.version !== 1) return d;
    return { ...d, ...p, settings: { ...d.settings, ...(p.settings ?? {}) }, unlocked: p.unlocked?.length ? p.unlocked : d.unlocked };
  } catch { return d; }
}

export function saveProgress(p: Progress, s: StorageLike | null = store()) { try { s?.setItem(KEY, JSON.stringify(p)); } catch { /* storage full or disabled */ } }
export function resetProgress(s: StorageLike | null = store()): Progress { try { s?.removeItem(KEY); } catch { /* ignore */ } return defaultProgress(); }

/** Apply a finished match once. Returns the list of newly unlocked city ids. */
export function recordResult(p: Progress, cityId: string, side: 'defence' | 'looters', won: boolean, research: number, cityOrder: string[]): string[] {
  p.matches++;
  p.research += research;
  const unlockedNow: string[] = [];
  if (won) {
    p.completed[cityId] = { ...(p.completed[cityId] ?? {}), [side]: true };
    if (cityId === 'paris') p.tutorialDone = true;
    const i = cityOrder.indexOf(cityId);
    const next = cityOrder[i + 1];
    if (next && !p.unlocked.includes(next)) { p.unlocked.push(next); unlockedNow.push(next); }
  }
  return unlockedNow;
}
