// TypeScript port of integration/shopVisualState.mjs from the Paris realism pack (assets/paris_realism).
// Pure visual adapter: it never writes to stock, collision or game state. Damage and stock are independent inputs.

export type ShopGroup = 'shell' | 'interior' | 'fixtures' | 'stock' | 'glass_intact' | 'glass_broken' | 'boards' | 'shutter_intact' | 'shutter_bent' | 'debris' | 'damage_decals';
export const SHOP_GROUPS: ShopGroup[] = ['shell', 'interior', 'fixtures', 'stock', 'glass_intact', 'glass_broken', 'boards', 'shutter_intact', 'shutter_bent', 'debris', 'damage_decals'];

export interface ShopVisualInput { damage?: number; stockRatio?: number; boardHealth?: number; breach?: boolean }
export interface ShopVisualState {
  referenceState: 'intact' | 'boarded' | 'damaged' | 'looted';
  groups: Record<ShopGroup, boolean>;
  visibleStockFraction: number;
  debrisDensity: number;
  boardIntegrity: number;
  damageAmount: number;
}

const clamp01 = (v: number | undefined, fallback = 0) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v as number)) : fallback);

/** thresholds 0.35 / 0.6 and 10 % stock are the pack's proposed visual starting values */
export function getShopVisualState({ damage = 0, stockRatio = 1, boardHealth = 0, breach = false }: ShopVisualInput = {}): ShopVisualState {
  const d = clamp01(damage), stock = clamp01(stockRatio, 1), boards = clamp01(boardHealth);
  const broken = Boolean(breach) || d >= 0.35;
  const boarded = boards > 0;
  const referenceState = boarded ? 'boarded' : broken ? (stock <= 0.1 ? 'looted' : 'damaged') : 'intact';
  return {
    referenceState,
    groups: {
      shell: true, interior: true, fixtures: true, stock: stock > 0,
      glass_intact: !broken, glass_broken: broken, boards: boarded,
      shutter_intact: d < 0.6, shutter_bent: d >= 0.6,
      debris: broken, damage_decals: d > 0,
    },
    visibleStockFraction: stock,
    debrisDensity: broken ? Math.max(0.2, d) : 0,
    boardIntegrity: boards,
    damageAmount: d,
  };
}

/** decorative stock slots only — never the real amount of goods */
export function visibleStockCount(totalSlots: number, stockRatio: number): number {
  const slots = Number.isFinite(totalSlots) ? Math.max(0, Math.floor(totalSlots)) : 0;
  return Math.round(slots * clamp01(stockRatio, 1));
}
