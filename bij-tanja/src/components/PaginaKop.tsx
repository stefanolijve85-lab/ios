import Link from "@/components/Lnk";
import { Foto } from "./Foto";

/** Openingsbeeld voor de subpagina's */
export function PaginaKop({
  label,
  titel,
  intro,
  foto,
  focus,
  kruimel,
}: {
  label: string;
  titel: React.ReactNode;
  intro: string;
  foto: string;
  focus?: string;
  kruimel: string;
}) {
  return (
    <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-olive-deep md:min-h-[72svh]">
      <Foto bestand={foto} focus={focus} sizes="100vw" priority className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d2214] via-[#1d2214]/50 to-[#1d2214]/20" />
      <div className="relative mx-auto w-full max-w-page px-4 pb-14 pt-32 sm:px-6 md:pb-20 lg:px-10">
        <nav aria-label="Kruimelpad" className="text-sm text-room/70">
          <ol className="flex gap-2">
            <li><Link href="/" className="link-underline">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-room">{kruimel}</li>
          </ol>
        </nav>
        <p className="mt-8 font-hand text-3xl text-honey-soft">{label}</p>
        <h1 className="display mt-2 max-w-[14ch] text-[clamp(2.8rem,9vw,6.5rem)] leading-[0.95] text-room">{titel}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-room/85">{intro}</p>
      </div>
    </section>
  );
}
