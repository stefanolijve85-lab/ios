import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
test('a firefighter sent to the burning barricade puts it out', () => {
  const g = new Game(PARIS, 'defence', { seed: 3 });
  g.buyUnit('firefighter');
  const ff = g.defenders().find((d) => d.kind === 'firefighter')!;
  const ci = PARIS.props.findIndex((p) => p.type === 'barricade_fire');
  const car = PARIS.props[ci];
  const amb = g.fires.find((f) => f.ambient)!; amb.id = 999;
  g.moveUnits([ff.id], car.x + 3, car.z + 1);
  for (let i = 0; i < 30 * 120 && g.fires.some((f) => f.id === 999 && !f.out); i++) g.step(1 / 30);
  expect(g.fires.find((f) => f.id === 999)?.out ?? true).toBe(true);
});
