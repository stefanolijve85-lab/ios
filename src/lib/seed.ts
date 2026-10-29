import { AppData, Room, Scene } from './types';

// Schone startopstelling: alleen lege kamers. Echte apparaten voeg je toe via
// Instellingen → "Tuya-apparaten importeren" / "Hue-lampen importeren", of met
// de + bij een kamer.

const room = (id: string, name: string, icon: string, order: number): Room => ({ id, name, icon, order });

const rooms: Room[] = [
  room('woonkamer', 'Woonkamer', '🛋️', 0),
  room('keuken', 'Keuken', '🍳', 1),
  room('slaapkamer', 'Slaapkamer', '🛏️', 2),
  room('badkamer', 'Badkamer', '🛁', 3),
  room('tuin', 'Tuin', '🌳', 4),
];

// Scènes zonder vaste lamp-id's: `all` geldt voor elke lamp in huis, dus ze
// werken meteen voor alles wat je later importeert.
const scenes: Scene[] = [
  { id: 'avond', name: 'Avond', icon: '🌙', targets: {}, all: { on: true, mode: 'white', kelvin: 2500, brightness: 40 } },
  { id: 'fel', name: 'Alles fel', icon: '☀️', targets: {}, all: { on: true, mode: 'white', kelvin: 4500, brightness: 100 } },
  { id: 'uit', name: 'Alles uit', icon: '⏻', targets: {}, all: { on: false } },
];

export const SEED: AppData = {
  rooms,
  lights: [],
  scenes,
  config: { demoMode: true },
};
