import type { MapDef } from './types';
import { PARIS } from './paris';

/** campaign order; a city is only selectable when `playable` is true and it has been unlocked */
export const CITY_ORDER = ['paris', 'amsterdam', 'london', 'milan', 'berlin', 'saopaulo'];

export const MAPS: Record<string, MapDef> = { paris: PARIS };

export const CITY_INFO: Record<string, { label: string; country: string; image: string }> = {
  paris: { label: 'Paris', country: 'France', image: 'ui/01_map_clean.jpg' },
  amsterdam: { label: 'Amsterdam', country: 'Netherlands', image: 'ui/21_amsterdam_canals.jpg' },
  london: { label: 'London', country: 'United Kingdom', image: 'ui/22_london_high_street.jpg' },
  milan: { label: 'Milan', country: 'Italy', image: 'ui/23_milan_arcade.jpg' },
  berlin: { label: 'Berlin', country: 'Germany', image: 'ui/24_berlin_courtyards.jpg' },
  saopaulo: { label: 'São Paulo', country: 'Brazil', image: 'ui/25_sao_paulo_retail.jpg' },
};
