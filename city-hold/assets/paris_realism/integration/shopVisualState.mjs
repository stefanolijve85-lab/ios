// Pure visual adapter example. No inventory mutation, rendering, collision or engine dependencies.
const clamp01 = (v, fallback = 0) => Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
export function getShopVisualState({ damage = 0, stockRatio = 1, boardHealth = 0, breach = false } = {}) {
  const d = clamp01(damage), stock = clamp01(stockRatio, 1), boards = clamp01(boardHealth);
  const broken = Boolean(breach) || d >= 0.35;
  const boarded = boards > 0;
  const referenceState = boarded ? 'boarded' : broken ? (stock <= 0.1 ? 'looted' : 'damaged') : 'intact';
  return {
    referenceState,
    groups: { shell: true, interior: true, fixtures: true, stock: stock > 0,
      glass_intact: !broken, glass_broken: broken, boards: boarded,
      shutter_intact: d < 0.6, shutter_bent: d >= 0.6,
      debris: broken, damage_decals: d > 0 },
    visibleStockFraction: stock,
    debrisDensity: broken ? Math.max(0.2, d) : 0,
    boardIntegrity: boards,
    damageAmount: d
  };
}
export function visibleStockCount(totalSlots, stockRatio) {
  const slots = Number.isFinite(totalSlots) ? Math.max(0, Math.floor(totalSlots)) : 0;
  return Math.round(slots * clamp01(stockRatio, 1));
}
