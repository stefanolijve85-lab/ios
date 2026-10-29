// Herkent uit een Tuya-apparaat (categorie + status-DP's) of het een lamp
// (RGB+CCT / CCT / dimbaar) of een stekker/schakelaar (aan/uit) is, en welke
// DP-codes erbij horen.

import { LightKind, Light } from './types';

export interface TuyaDevice {
  id: string;
  name: string;
  category?: string;
  product_name?: string;
  online?: boolean;
  status?: { code: string; value: unknown }[];
}

// Tuya-categorieën voor verlichting en voor stekkers/schakelaars.
const LIGHT_CATS: Record<string, string> = {
  dj: 'Lamp', dd: 'Ledstrip', xdd: 'Plafondlamp', fwd: 'Sfeerlamp', dc: 'Lichtsnoer',
  sxd: 'Spot', tyndj: 'Zonnelamp', gyd: 'Bewegingslamp', tgq: 'Dimmer', tgkg: 'Dimschakelaar', fsd: 'Ventilatorlamp',
};
const PLUG_CATS: Record<string, string> = {
  cz: 'Stekker', pc: 'Stekkerdoos', kg: 'Schakelaar', tdq: 'Schakelaar', wkcz: 'Stekker', dlq: 'Schakelaar', qjdcz: 'Stekker',
};

export interface Detected {
  kind: LightKind;
  isPlug: boolean;
  label: string;
  icon: string;
  dp: NonNullable<Light['ref']['dp']>;
  on?: boolean;
}

export function detectTuya(dev: TuyaDevice): Detected {
  const cat = dev.category || '';
  const codes = new Set((dev.status || []).map((s) => s.code));
  const pick = (...c: string[]) => c.find((x) => codes.has(x));
  const isLightCat = cat in LIGHT_CATS || codes.has('switch_led');

  const colour = pick('colour_data_v2', 'colour_data');
  const temp = pick('temp_value_v2', 'temp_value');
  const bright = pick('bright_value_v2', 'bright_value', 'bright_value_1');
  const sw =
    pick('switch_led', 'switch_1', 'switch', 'switch_led_1') ||
    [...codes].find((c) => c.startsWith('switch'));

  let kind: LightKind;
  if (isLightCat) {
    if (codes.size === 0) kind = cat === 'tgq' || cat === 'tgkg' ? 'dimmable' : 'rgbcct';
    else kind = colour ? 'rgbcct' : temp ? 'cct' : bright ? 'dimmable' : 'onoff';
  } else {
    kind = 'onoff';
  }

  const dp: Detected['dp'] = {};
  if (sw) dp.switch = sw;
  else if (!isLightCat) dp.switch = 'switch_1';
  if (bright) dp.bright = bright;
  if (temp) dp.temp = temp;
  if (colour) dp.colour = colour;

  const isPlug = !isLightCat;
  const onVal = sw ? dev.status?.find((s) => s.code === sw)?.value : undefined;
  const label = LIGHT_CATS[cat] || PLUG_CATS[cat] || dev.product_name || cat || 'Apparaat';
  const icon = isPlug ? 'plug' : cat === 'dd' || cat === 'dc' ? 'strip' : cat === 'xdd' ? 'ceiling' : 'lamp';

  return { kind, isPlug, label, icon, dp, on: typeof onVal === 'boolean' ? onVal : undefined };
}

export const KIND_LABEL: Record<LightKind, string> = {
  rgbcct: 'RGB+CCT',
  cct: 'Wit (CCT)',
  dimmable: 'Dimbaar',
  onoff: 'Aan/uit',
};
