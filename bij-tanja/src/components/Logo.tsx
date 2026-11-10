import Link from "@/components/Lnk";

/** Klein kaaspuntje als beeldmerk */
export function KaasMerk({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" aria-hidden="true" className={className} fill="none">
      <path d="M3 24.5 33.5 9.2c1.6-.8 3.5.4 3.5 2.2v12.1c0 1.4-1.1 2.5-2.5 2.5H3.9c-1 0-1.4-1.1-.9-1.5Z" fill="currentColor" opacity=".18" />
      <path d="M3 24.5 33.5 9.2c1.6-.8 3.5.4 3.5 2.2v12.1c0 1.4-1.1 2.5-2.5 2.5H3.9c-1 0-1.4-1.1-.9-1.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.4 24.3 30 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="27" cy="19.5" r="2.2" fill="currentColor" />
      <circle cx="18.5" cy="21.8" r="1.4" fill="currentColor" />
      <circle cx="32.6" cy="15.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Woordmerk "Bij Tanja" */
export function Logo({
  tone = "dark",
  size = "md",
  asLink = true,
}: {
  tone?: "dark" | "light";
  size?: "md" | "lg";
  asLink?: boolean;
}) {
  const color = tone === "dark" ? "text-olive-deep" : "text-room";
  const inner = (
    <span className={`group inline-flex items-end gap-2 ${color}`}>
      <span className="flex flex-col items-start leading-none">
        <span
          className={`font-sans font-semibold uppercase tracking-[0.42em] ${
            size === "lg" ? "text-[0.8rem] pl-1.5" : "text-[0.68rem] pl-1"
          } opacity-90`}
        >
          Bij
        </span>
        <span className={`font-script ${size === "lg" ? "text-[4.2rem] -mt-2" : "text-[2.15rem] -mt-1"} leading-[0.95]`}>
          Tanja
        </span>
      </span>
      <KaasMerk
        className={`${size === "lg" ? "mb-3 w-10" : "mb-1.5 w-6"} text-honey transition-transform duration-500 ease-soft group-hover:-rotate-12`}
      />
    </span>
  );
  if (!asLink) return inner;
  return (
    <Link href="/" aria-label="Bij Tanja — naar de homepage" className="rounded-md">
      {inner}
    </Link>
  );
}
