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

export function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
