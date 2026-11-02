import { describe, expect, test } from 'vitest';
import { toDutch } from '../src/ui/i18n_nl';

describe('Dutch HUD', () => {
  test('phrases, messages with numbers and names translate; numbers and symbols are kept', () => {
    expect(toDutch('STORES WITH STOCK')).toBe('WINKELS MET VOORRAAD');
    expect(toDutch('Insufficient budget')).toBe('Onvoldoende budget');
    expect(toDutch('Jewellery: boarded up (+60 protection, -150)')).toBe('Juwelier: dichtgetimmerd (+60 bescherming, -150)');
    expect(toDutch('Wave 3 started: 7 offenders')).toBe('Golf 3 gestart: 7 daders');
    expect(toDutch('Upgrade shutter · 300')).toBe('Rolluik versterken · 300');
    expect(toDutch('VICTORY — District held')).toBe('GEWONNEN — Wijk behouden');
  });
  test('translated text is stable (running twice changes nothing) and no phrase leaks into a longer word', () => {
    const once = toDutch('Electronics · stock 40 (−5 moving)');
    expect(toDutch(once)).toBe(once);
    expect(toDutch('restock')).toBe('restock');
  });
});
