import { test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { run, autoDefence, autoLooter, mapReachability } from './helpers';
test.skipIf(!(globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PROBE)('balance probe (set PROBE=1 to print)', () => {
  console.log('unreachable', mapReachability(PARIS));
  { const g = new Game(PARIS, 'defence', { seed: 5 }); run(g, 3600, (gg) => { if (gg.phase === 'prep') gg.startWave(); });
    console.log('DEF-PASSIVE', g.phase, 'wave', g.wave, 'stock', g.stores.map(s=>s.stock), 't', g.time.toFixed(0)); }
  for (const seed of [1,2,3]) {
    const g = new Game(PARIS, 'defence', { seed });
    const ai = autoDefence(g); const t0=Date.now();
    run(g, 3600, ai);
    console.log('DEF seed', seed, g.phase, 'wave', g.wave, 'cleared', g.wavesCleared, 'stock', g.stores.map(s=>s.stock+'/'+s.structure.toFixed(0)), 'int', g.intercepted, 'ext', g.extracted, 'budget', g.budget, 't', g.time.toFixed(0), 'ms', Date.now()-t0);
  }
  for (const route of [undefined, 'nw','ne','s','w']) {
    const g = new Game(PARIS, 'looters', { seed: 7 });
    run(g, 600, autoLooter(g, { route }));
    console.log('LOOT', route, g.phase, 'extracted', g.extracted, 'int', g.intercepted, 'time', g.time.toFixed(0), 'budget', g.budget, g.result?.title);
  }
}, 120000);
