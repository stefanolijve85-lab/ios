import { test } from 'vitest';
import { Game } from '../src/sim/game';
import { MAPS } from '../src/maps';
import { run, autoDefence, autoLooter, mapReachability } from './helpers';
test.skipIf(!(globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PROBE)('city probe', () => {
  for (const [id, m] of Object.entries(MAPS)) {
    const unreachable = mapReachability(m);
    const g = new Game(m, 'defence', { seed: 1 }); run(g, 3600, autoDefence(g));
    const p = new Game(m, 'defence', { seed: 5 }); run(p, 3600, (gg) => { if (gg.phase === 'prep') gg.startWave(); });
    const res: string[] = [];
    for (const seed of [1, 2]) { const l = new Game(m, 'looters', { seed }); run(l, 480, autoLooter(l)); res.push(`${l.phase}:${l.extracted}`); }
    const badSock = m.sockets.filter((s) => !g.nav.walkable(s.x, s.z)).map((s) => s.id);
    console.log(id, 'unreach', unreachable, 'badSockets', badSock, '| DEF', g.phase, g.wavesCleared, g.stores.map((s) => s.stock), '| PASSIVE', p.phase, p.wave, '| LOOT', res.join(' '), g.truck ? `truck rewarded ${g.truck.rewarded}` : '');
  }
}, 1500000);
