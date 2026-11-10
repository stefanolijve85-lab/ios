import { KaasMerk } from "./Logo";

const woorden = ["Kaas", "Noten", "Wijn", "Bubbels", "Speciaalbier", "Sapjes", "Snoep", "Worstjes", "Delicatessen", "Cadeaus"];

/** Langzaam lopende band met woorden — puur decoratief. */
export function Ribbon({ tone = "honey" }: { tone?: "honey" | "olive" }) {
  const cls = tone === "honey" ? "bg-honey text-ink" : "bg-olive-deep text-honey-soft";
  const rij = (
    <ul className="flex shrink-0 items-center">
      {woorden.map((w) => (
        <li key={w} className="flex items-center gap-6 px-6">
          <span className="display text-2xl italic md:text-3xl">{w}</span>
          <KaasMerk className="w-6 opacity-70" />
        </li>
      ))}
    </ul>
  );
  return (
    <div aria-hidden="true" className={`${cls} overflow-hidden py-4 select-none`}>
      <div className="ribbon-track flex w-max">
        {rij}
        {rij}
      </div>
    </div>
  );
}
