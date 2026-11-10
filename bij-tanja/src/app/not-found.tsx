import Link from "@/components/Lnk";
import { KaasMerk } from "@/components/Logo";

export default function NietGevonden() {
  return (
    <section className="grid min-h-[80svh] place-items-center bg-olive-deep px-4 pt-[var(--header-h)] text-center text-room">
      <div>
        <KaasMerk className="mx-auto w-20 text-honey" />
        <p className="mt-6 font-hand text-3xl text-honey-soft">Oeps!</p>
        <h1 className="display mt-2 text-5xl">Deze pagina is op</h1>
        <p className="mx-auto mt-4 max-w-md text-room/75">Net als de laatste plak oude kaas. Maar er is nog genoeg anders lekkers te ontdekken.</p>
        <Link href="/" className="btn btn-honey mt-8">Terug naar de winkel</Link>
      </div>
    </section>
  );
}
