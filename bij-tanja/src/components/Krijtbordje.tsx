/** Klein "krijtbordje", zoals de prijskaartjes in de winkel. */
export function Krijtbordje({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block rounded-[6px] bg-[#1f1f1c] px-3 py-1.5 font-hand text-xl leading-none text-room shadow-[0_6px_14px_-6px_rgba(0,0,0,.6)] ring-1 ring-white/10 ${className}`}
    >
      {children}
    </span>
  );
}
