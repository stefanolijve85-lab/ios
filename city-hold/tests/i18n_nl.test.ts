import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { MAPS } from '../src/maps';
import { toDutch } from '../src/ui/i18n_nl';
import { autoDefence, autoLooter } from './helpers';

// English words that must never survive the Dutch translation of a game message
const EN = /(?<!-)\b(the|and|not|no|to|of|with|from|for|are|at|on|only|enough|active|already|ready|your|too|there|here|out|by|this|that|it|was|has|have|can|cannot|will|nothing|first|needs?|a|an|stores?|units?|stock|extracted|placed|deployed|sent|offline|reach|close|busy|way|fire|team|teams|wave|waves|lost|held|time|left|free|guard)\b/i;

/** play whole matches on every map, both sides, poke every action (also in the wrong phase) and collect every text */
function collect(): Set<string> {
  const texts = new Set<string>();
  let seed = 3;
  for (const map of Object.values(MAPS)) {
    if (!map.playable) continue;
    for (const side of ['defence', 'looters'] as const) {
      const g = new Game(map, side, { seed: seed++ });
      const add = (r?: { reason?: string }) => { if (r?.reason) texts.add(r.reason); };
      const pokes = () => {
        const s0 = map.sockets[0]; const x = g.stores[0]?.door.x ?? 0; const z = g.stores[0]?.door.z ?? 0;
        if (side === 'defence') {
          for (const k of ['security', 'shield', 'firefighter'] as const) add(g.buyUnit(k));
          for (const k of ['barrier', 'concrete', 'camera'] as const) { add(g.canPlace(k, s0.id)); add(g.place(k, 'nope')); }
          add(g.fireCannon(x, z)); add(g.fireCannon(500, 500)); add(g.sendBlus(x, z)); add(g.sendBlus(500, 500));
          add(g.deployRomeo('bus', x, z)); add(g.deployRomeo('public', x, z)); add(g.deployRomeo('bus', x, z)); add(g.deployRomeo('bus', x, z));
          add(g.tearGas(x, z)); add(g.flashBang(x, z)); add(g.boardUp(0)); add(g.boardUp(0)); add(g.repairStore(0)); add(g.upgradeShutter(0));
          add(g.upgradeSecurity()); add(g.chooseSecuritySpec('mobile')); add(g.chooseCameraSpec('wide')); add(g.moveUnits([], 999, 999));
          add(g.orderExtinguish([], 1));
        } else {
          add(g.dispatch()); add(g.retarget([], 0)); add(g.looterUpgradeChoose('capacity')); add(g.looterUpgradeChoose('speed'));
          for (const sk of ['tablet', 'laptop', 'radio'] as const) { add(g.deployHacker(sk, x, z)); add(g.deployHacker(sk, 500, 500)); add(g.deployHacker(sk, x, z)); }
        }
      };
      pokes();
      const bot = side === 'defence' ? autoDefence(g) : autoLooter(g);
      for (let t = 0; t < 1500 && !g.over; t += 1 / 30) {
        if (side === 'defence' && g.phase === 'prep' && !g.over) { bot(g); add(g.startWave()); }
        else if (side === 'looters') bot(g);
        if (Math.floor(t * 30) % 900 === 0) pokes();
        g.step(1 / 30);
        for (const e of g.drainEvents()) if (e.text) texts.add(e.text);
      }
      if (g.result) { texts.add(g.result.title); texts.add(g.result.detail); }
    }
  }
  return texts;
}

test('every game message reads as Dutch after translation', () => {
  const texts = collect();
  expect(texts.size).toBeGreaterThan(40);
  const bad = [...texts].map((t) => [t, toDutch(t)]).filter(([, nl]) => EN.test(nl));
  expect(bad.map(([en, nl]) => `${en}  =>  ${nl}`)).toEqual([]);
}, 600000);
