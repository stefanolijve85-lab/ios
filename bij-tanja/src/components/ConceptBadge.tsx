/** Zichtbaar label op de preview-versie, zodat niemand denkt dat dit al de live site is. */
export function ConceptBadge() {
  if (process.env.NEXT_PUBLIC_CONCEPT !== "1") return null;
  return (
    <div
      role="note"
      className="pointer-events-none fixed left-1/2 top-[calc(var(--header-h)+0.5rem)] z-[45] -translate-x-1/2 whitespace-nowrap rounded-full bg-bordeaux px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-room shadow-lg"
    >
      Concept-preview
    </div>
  );
}
