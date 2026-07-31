export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-xl bg-brand-gradient text-white shadow-glow"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3 4 6.5v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-5L12 3z"
          fill="rgba(255,255,255,.18)"
        />
        <path
          d="M8 12.5 11 15.5 16.5 9.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Logo size={size} />
      <span className="text-lg font-bold tracking-tight">
        Civ<span className="text-brand-soft">itas</span>
      </span>
    </span>
  );
}
