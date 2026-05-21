"use client";

export function Sparkline({
  data,
  width = 320,
  height = 64,
}: {
  data: { date: string; score: number }[];
  width?: number;
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="text-xs text-ink-500">No data yet.</div>;
  }
  const xs = data.map((_, i) => (i / Math.max(1, data.length - 1)) * width);
  const ys = data.map((d) => height - (d.score / 100) * (height - 8) - 4);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(31 151 100)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(31 151 100)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke="rgb(31 151 100)" strokeWidth="2" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={1.6} className="fill-accent-500" />
      ))}
    </svg>
  );
}
