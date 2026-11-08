/** Het vierbladige sterretje uit het logo, als lichte SVG. */
export function Star({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      <path d="M50 2C53 20 54 38 50 48 46 38 47 20 50 2Z" />
      <path d="M98 50C80 53 62 54 52 50 62 46 80 47 98 50Z" />
      <path d="M50 98C47 80 46 62 50 52 54 62 53 80 50 98Z" />
      <path d="M2 50C20 47 38 46 48 50 38 54 20 53 2 50Z" />
    </svg>
  );
}
