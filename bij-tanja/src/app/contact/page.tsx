import { PaginaKop } from "@/components/PaginaKop";
import { Langskomen } from "@/components/Langskomen";
import { Foto } from "@/components/Foto";
import { Reveal } from "@/components/Reveal";
import { paginaMeta } from "@/lib/seo";
import { winkel } from "@/content/winkel";

export const metadata = paginaMeta({
  titel: "Contact & openingstijden — Winkelcentrum Angelslo",
  beschrijving: "Kom gezellig langs bij Bij Tanja in Winkelcentrum Angelslo, Emmen. Adres, openingstijden en route naar de winkel.",
  pad: "/contact",
  foto: "winkel-entree-tanja.jpg",
});

export default function ContactPagina() {
  return (
    <>
      <PaginaKop
        kruimel="Contact"
        label="Kom gezellig langs!"
        titel={<>Zo vind je <em className="text-honey-soft">Tanja</em></>}
        intro={`In ${winkel.adres.winkelcentrum} in ${winkel.adres.plaats}. De deur staat open, loop maar binnen.`}
        foto="tanja-in-de-deur.jpg"
        focus="72% 40%"
      />
      <Langskomen />
      <section aria-labelledby="herken-titel" className="bg-room py-24">
        <div className="mx-auto grid max-w-page items-center gap-10 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
          <Reveal className="md:col-span-5">
            <p className="label text-bordeaux">Handig om te weten</p>
            <h2 id="herken-titel" className="display mt-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1] text-olive-deep">
              Zoek het wijnvat <em className="text-bordeaux">en de koe</em>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              Loop je door het winkelcentrum? Bij de ingang van Bij Tanja staan een groot houten wijnvat en een zwartbonte koe. Dan weet je dat je goed zit!
            </p>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-6 md:col-start-7">
            <Foto
              bestand="winkel-entree-tanja.jpg"
              alt="De ingang van Bij Tanja met het houten wijnvat en het koeienbeeld voor de etalage"
              focus="12% 70%"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/3] rounded-[2px]"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
