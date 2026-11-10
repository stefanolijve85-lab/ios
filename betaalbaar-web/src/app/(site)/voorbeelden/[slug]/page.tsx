import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/config/site";
import { FullPage, Pair, StatusBadge } from "@/components/Mockup";
import { Closing } from "@/components/Sections";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = projects.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: `${p.name}: ${p.status === "concept" ? "conceptvoorbeeld" : "project"} website`,
    description: p.summary,
    alternates: { canonical: `/voorbeelden/${p.slug}` },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const p = projects.find((x) => x.slug === params.slug);
  if (!p) notFound();
  return (
    <>
      <section className="page-head">
        <div className="wrap two">
          <div>
            <p className="eyebrow"><Link href="/voorbeelden">Voorbeelden</Link> / {p.kind}</p>
            <h1>{p.name}</h1>
            <p><StatusBadge status={p.status} /></p>
            <p className="lead">{p.summary}</p>
            {p.status === "concept" && (
              <p className="note">Dit is een conceptvoorbeeld: het laat de ontwerprichting zien en is geen opgeleverde, live website. {p.imageNote}</p>
            )}
            {p.liveUrl && <p><a href={p.liveUrl} rel="noopener">Bekijk de website</a></p>}
          </div>
          <Pair project={p} />
        </div>
      </section>
      <section className="section dark">
        <div className="wrap" style={{ maxWidth: 1000 }}>
          <div className="head"><p className="eyebrow">De hele pagina</p><h2>Scrol door het ontwerp.</h2></div>
          <FullPage project={p} />
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="rows">
            <div><h2 style={{ fontSize: "1.3rem" }}>Ontwerpdoelen</h2><ul className="ticks">{p.goals.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h2 style={{ fontSize: "1.3rem" }}>Visuele keuzes</h2><ul className="ticks plain">{p.visual.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h2 style={{ fontSize: "1.3rem" }}>Functionele keuzes</h2><ul className="ticks plain">{p.functional.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>Dit zijn ontwerpdoelen, geen gemeten resultaten. Of alle onderdelen van dit voorbeeld binnen het basispakket vallen, hangt af van de pakketomvang die we in je overzicht bevestigen.</p>
        </div>
      </section>
      <Closing />
    </>
  );
}
