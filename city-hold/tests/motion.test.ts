import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { MAPS } from '../src/maps';
import { autoDefence, autoLooter } from './helpers';

// Motion audit: plays whole matches and records anything a player would see as "wrong" movement.
test('motion audit: whole matches in every city without jumps, units in walls or visible walking on the spot', () => {
  const total: Record<string, number> = {};
  for (const [id, m] of Object.entries(MAPS)) {
    for (const side of ['defence', 'looters'] as const) {
      const g = new Game(m, side, { seed: 4 });
      const bot = side === 'defence' ? autoDefence(g) : autoLooter(g);
      const hist = new Map<number, { x: number; z: number; t: number; movingT: number; stillT: number; state: string; stateT: number; prevX: number; prevZ: number; vx: number; vz: number; v: number; on: boolean; visT: number }>();
      const issues: Record<string, number> = {}; const ex: Record<string, string[]> = {};
      const flag = (k: string, s: string) => { issues[k] = (issues[k] ?? 0) + 1; (ex[k] ??= []).push(s); };
      const dt = 1 / 30;
      for (let t = 0; t < 600 && !g.over; t += dt) {
        g.step(dt); bot(g);
        for (const u of g.units) {
          let h = hist.get(u.id);
          if (!h) { h = { x: u.x, z: u.z, t, movingT: 0, stillT: 0, state: u.state, stateT: 0, prevX: u.x, prevZ: u.z, vx: u.x, vz: u.z, v: 0, on: false, visT: 0 }; hist.set(u.id, h); }
          // the view's motion filter (render/view.ts motion()): what the player sees as walking
          { const k = 1 - Math.exp(-dt * 20); const ox = h.vx, oz = h.vz; h.vx += (u.x - h.vx) * k; h.vz += (u.z - h.vz) * k;
            const inst = Math.hypot(h.vx - ox, h.vz - oz) / dt; h.v += (Math.min(inst, 8) - h.v) * Math.min(1, dt * 9); h.on = h.on ? h.v > 0.22 : h.v > 0.55; if (h.on) h.visT += dt; }
          const jump = Math.hypot(u.x - h.prevX, u.z - h.prevZ);
          if (jump > 0.6 && u.state !== 'escorted') flag('jump>0.6m/tick', `${u.kind} ${u.state} ${jump.toFixed(2)}m @${t.toFixed(1)}s`);
          h.prevX = u.x; h.prevZ = u.z;
          if (!g.nav.walkable(u.x, u.z)) flag('inside-solid', `${u.kind} ${u.state} @${u.x.toFixed(1)},${u.z.toFixed(1)}`);
          if (u.state !== h.state) { h.state = u.state; h.stateT = 0; } else h.stateT += dt;
          // stepping on the spot: flagged moving but net travel over 2 s is tiny
          if (t - h.t >= 2) {
            const net = Math.hypot(u.x - h.x, u.z - h.z);
            if (h.visT > 1.6 && net < 0.4) flag('visible-walk-on-spot', `${u.side}/${u.kind} ${u.state} net ${net.toFixed(2)}m @${t.toFixed(1)}s (${u.x.toFixed(1)},${u.z.toFixed(1)})`);
            if (u.side === 'att' && (u.state === 'approach' || u.state === 'extract') && h.stillT > 1.9) flag('att-frozen', `${u.kind} ${u.state} @${t.toFixed(1)}s (${u.x.toFixed(1)},${u.z.toFixed(1)})`);
            h.x = u.x; h.z = u.z; h.t = t; h.movingT = 0; h.stillT = 0; h.visT = 0;
          }
          if (u.moving) h.movingT += dt; else if (u.state === 'approach' || u.state === 'extract') h.stillT += dt;
          if (h.stateT > 40 && ['approach', 'extract', 'move', 'return', 'flee'].includes(u.state)) { flag('state>40s', `${u.side}/${u.kind} ${u.state} (${u.x.toFixed(1)},${u.z.toFixed(1)})`); h.stateT = -1e9; }
        }
        // seated terrace guests sit inside the table area on purpose; anyone walking must stay on walkable ground
        for (const n of g.npcs) if (n.state !== 'gone' && n.moving && !g.nav.walkable(n.x, n.z)) flag('npc-inside-solid', `${n.role} ${n.state}`);
      }
      for (const [k, v] of Object.entries(issues)) total[k] = (total[k] ?? 0) + v;
      if (process.env.MOTION) console.log('MOTION', id.padEnd(9), side.padEnd(8), g.phase, Object.keys(issues).length ? JSON.stringify(issues) : 'clean', Object.keys(ex).length ? '\n   ' + Object.entries(ex).map(([k, v]) => `${k}: ${v.join(' | ')}`).join('\n   ') : '');
    }
  }
  // turning back to chase someone new can look like a short back-and-forth; anything more is a regression
  expect(total['jump>0.6m/tick'] ?? 0).toBe(0);
  expect(total['inside-solid'] ?? 0).toBe(0);
  expect(total['npc-inside-solid'] ?? 0).toBe(0);
  expect(total['att-frozen'] ?? 0).toBe(0);
  // guards pushing offenders to an exit walk back through busy lanes: short shuffles while the crowd clears
  expect(total['visible-walk-on-spot'] ?? 0).toBeLessThanOrEqual(24);
}, 300000);
