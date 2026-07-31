// Tiny, dependency-free SVG charts for the analytics dashboard.

export function LineChart({
  data,
  height = 60,
  color = 'rgb(var(--brand))',
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = 100 / (data.length - 1);
  const pts = data.map((v, i) => [i * step, 100 - ((v - min) / range) * 100] as const);
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `0,100 ${line} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height={height} aria-hidden>
      <defs>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lc)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function BarChart({
  data,
  labels,
  height = 90,
  color = 'rgb(var(--accent))',
}: {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: 3 }}
            />
          </div>
          {labels && <span className="text-[9px] text-muted">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}
