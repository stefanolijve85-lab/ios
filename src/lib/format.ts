export function euro(n: number, decimals = 2): string {
  return '€' + n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function compactEuro(n: number): string {
  if (n >= 1000) return '€' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return '€' + Math.round(n).toLocaleString('en-US');
}

export function num(n: number): string {
  return n.toLocaleString('en-US');
}

export function mult(m: number): string {
  return m.toFixed(2) + 'x';
}

// Net winnings (profit) from a gross payout: the stake is the player's own money
// and is returned, so the actual "win" is payout − stake = payout × (1 − 1/m).
// Used everywhere a win is shown so we never count the stake as winnings.
export function netWin(payout: number, multiplier: number): number {
  if (!multiplier || multiplier <= 1) return 0;
  return payout - payout / multiplier;
}

export function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
