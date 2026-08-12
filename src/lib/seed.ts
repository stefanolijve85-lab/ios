import { AppData, DEFAULT_STATE, Light, Room, Scene } from './types';

// Startopstelling. Alles draait in demo-modus totdat je Tuya/Hue koppelt in
// Instellingen. De MiBoxer-items hieronder verwijzen alvast naar je echte
// gateway/controllers (device-id's uit je app), zodat ze meteen werken zodra
// je de Tuya-cloud koppelt.

const room = (id: string, name: string, icon: string, order: number): Room => ({ id, name, icon, order });

const rooms: Room[] = [
  room('woonkamer', 'Woonkamer', '🛋️', 0),
  room('tvwand', 'TV-wand', '📺', 1),
  room('keuken', 'Keuken', '🍳', 2),
  room('slaapkamer', 'Slaapkamer', '🛏️', 3),
  room('tuin', 'Tuin', '🌳', 4),
];

let n = 0;
const light = (
  name: string,
  roomId: string,
  partial: Partial<Light>,
  state: Partial<typeof DEFAULT_STATE> = {},
): Light => ({
  id: partial.id || `l${++n}`,
  name,
  roomId,
  backend: partial.backend || 'demo',
  kind: partial.kind || 'rgbcct',
  icon: partial.icon,
  ref: partial.ref || {},
  state: { ...DEFAULT_STATE, ...state },
});

// MiBoxer gateway "woonkamer" (FUT089 / B8, RGB+CCT) — device bfac96f086cae182b48vsk
const GATEWAY = 'bfac96f086cae182b48vsk';

const lights: Light[] = [
  // Woonkamer — de 8 zones van de FUT089-gateway, met echte namen i.p.v. "Zone 5".
  light('Plafond', 'woonkamer', { id: 'wk-z1', backend: 'tuya', ref: { deviceId: GATEWAY, zone: 1 }, icon: 'ceiling' }, { on: true, mode: 'white', kelvin: 4100, brightness: 100 }),
  light('Sfeer achter TV', 'woonkamer', { id: 'wk-z2', backend: 'tuya', ref: { deviceId: GATEWAY, zone: 2 }, icon: 'strip' }, { on: true, mode: 'color', hue: 265, saturation: 100, brightness: 70 }),
  light('Eettafel', 'woonkamer', { id: 'wk-z3', backend: 'tuya', ref: { deviceId: GATEWAY, zone: 3 }, icon: 'pendant' }, { on: false, mode: 'white', kelvin: 2700, brightness: 80 }),
  light('Leeshoek', 'woonkamer', { id: 'wk-z4', backend: 'tuya', ref: { deviceId: GATEWAY, zone: 4 }, icon: 'lamp' }, { on: false }),

  // TV-wand — losse MiBoxer/Tuya-controllers uit je apparatenlijst.
  light('TV-wand', 'tvwand', { id: 'tvw', backend: 'tuya', ref: { deviceId: 'bf187bdc7f5cbd84c1jng6' }, icon: 'strip' }, { on: false, mode: 'color', hue: 210, saturation: 100 }),
  light('TV-wand onder', 'tvwand', { id: 'tvwo', backend: 'tuya', ref: { deviceId: 'bf49b3f4e8a15aacd7ywe1' }, icon: 'strip' }, { on: false, mode: 'color', hue: 320, saturation: 100 }),

  // Keuken — voorbeeld (Hue-plek en demo).
  light('Werkblad', 'keuken', { id: 'kk1', backend: 'demo', kind: 'cct', icon: 'strip' }, { on: true, mode: 'white', kelvin: 5000 }),
  light('Kookeiland', 'keuken', { id: 'kk2', backend: 'demo', icon: 'pendant' }, { on: false }),

  // Slaapkamer — voorbeeld Hue-lampen.
  light('Nachtkastje', 'slaapkamer', { id: 'sk1', backend: 'demo', icon: 'lamp' }, { on: true, mode: 'color', hue: 25, saturation: 80, brightness: 30 }),
  light('Plafond', 'slaapkamer', { id: 'sk2', backend: 'demo', icon: 'ceiling' }, { on: false }),

  // Tuin.
  light('Terras', 'tuin', { id: 'tn1', backend: 'demo', icon: 'outdoor' }, { on: false, mode: 'color', hue: 130, saturation: 90 }),
  light('Border', 'tuin', { id: 'tn2', backend: 'demo', icon: 'outdoor' }, { on: false, mode: 'color', hue: 30, saturation: 100, brightness: 60 }),
  light('Vijver', 'tuin', { id: 'tn3', backend: 'demo', icon: 'outdoor' }, { on: false, mode: 'color', hue: 200, saturation: 100 }),
];

const scenes: Scene[] = [
  {
    id: 'avond', name: 'Avond', icon: '🌙',
    targets: Object.fromEntries(lights.map((l) => [l.id, l.roomId === 'tuin' ? { on: false } : { on: true, mode: 'white' as const, kelvin: 2500, brightness: 40 }])),
  },
  {
    id: 'fel', name: 'Alles fel', icon: '☀️',
    targets: Object.fromEntries(lights.map((l) => [l.id, { on: true, mode: 'white' as const, kelvin: 4500, brightness: 100 }])),
  },
  {
    id: 'film', name: 'Film', icon: '🎬',
    targets: {
      'wk-z1': { on: false }, 'wk-z3': { on: false }, 'wk-z4': { on: false },
      'wk-z2': { on: true, mode: 'color', hue: 265, saturation: 100, brightness: 25 },
      'tvw': { on: true, mode: 'color', hue: 210, saturation: 100, brightness: 20 },
      'tvwo': { on: true, mode: 'color', hue: 265, saturation: 100, brightness: 20 },
    },
  },
  {
    id: 'tuin', name: 'Tuin aan', icon: '🌳',
    targets: { 'tn1': { on: true, brightness: 80 }, 'tn2': { on: true, brightness: 70 }, 'tn3': { on: true, brightness: 90 } },
  },
  {
    id: 'uit', name: 'Alles uit', icon: '⏻',
    targets: Object.fromEntries(lights.map((l) => [l.id, { on: false }])),
  },
];

export const SEED: AppData = {
  rooms,
  lights,
  scenes,
  config: { demoMode: true },
};
