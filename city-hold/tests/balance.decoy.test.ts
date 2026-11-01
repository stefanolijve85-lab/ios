import { test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { run } from './helpers';
test.skipIf(!process.env.PROBE)('decoy strategies (set PROBE=1 to print)', () => {
  for (const [decoy, main, dr, mr] of [[1,0,'s','nw'],[1,2,'s','ne'],[0,2,'nw','ne'],[2,0,'ne','nw'],[1,0,'ne','w']] as const) {
    const g = new Game(PARIS, 'looters', { seed: 3 });
    let stage = 0; let t0 = 0;
    run(g, 480, (gg) => {
      if (gg.attackers().length + gg.dispatchQueue.length > 0 && stage !== 1) return;
      if (stage === 0) { gg.setLooterTarget(decoy); gg.setLooterRoute(dr); gg.recruit('runner'); gg.recruit('runner'); gg.dispatch(); stage = 1; t0 = gg.time; return; }
      if (stage === 1) { if (gg.time - t0 < 7) return; gg.setLooterTarget(main); gg.setLooterRoute(mr); while (gg.budget >= 150 && gg.squad.length < 5) gg.recruit('carrier'); gg.dispatch(); stage = 2; return; }
      if (stage === 2) { const tgt = gg.stores.filter(s=>s.stock>0).sort((a,b)=>b.stock-a.stock)[0]; gg.setLooterTarget(main); gg.setLooterRoute(mr); while (gg.budget >= 150 && gg.squad.length < 5) gg.recruit('carrier'); if (gg.squad.length===0 && gg.budget>=100) gg.recruit('runner'); if (gg.squad.length) gg.dispatch(); }
    });
    console.log('DECOY', decoy, main, dr, mr, g.phase, g.extracted, 'int', g.intercepted, 't', g.time.toFixed(0));
  }
}, 60000);
