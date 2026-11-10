import type { Project } from "@/config/site";

/**
 * Schermbeelden van de voorbeeldsites in een browser- of telefoonkader.
 * De beelden staan in /public/portfolio en zijn vooraf geoptimaliseerd (WebP),
 * met vaste afmetingen zodat de pagina niet verspringt tijdens het laden.
 */
const base = (slug: string) => `/portfolio/${slug}`;

export function Desktop({ project, eager, sizes = "(min-width: 960px) 560px, 92vw" }: { project: Project; eager?: boolean; sizes?: string }) {
  return (
    <div className="mock">
      <div className="mock-bar" aria-hidden="true"><i /><i /><i /><span>{project.name}</span></div>
      <img
        src={`${base(project.slug)}-desktop.webp`}
        srcSet={`${base(project.slug)}-desktop-800.webp 800w, ${base(project.slug)}-desktop.webp 1440w`}
        sizes={sizes}
        width={1440} height={900}
        alt={`${project.imageAlt} (desktop)`}
        loading={eager ? "eager" : "lazy"} decoding="async"
        {...(eager ? { fetchPriority: "high" as const } : {})}
      />
    </div>
  );
}

export function Phone({ project, eager }: { project: Project; eager?: boolean }) {
  return (
    <div className="phone">
      <img src={`${base(project.slug)}-mobile.webp`} width={520} height={1125} alt={`${project.imageAlt} (mobiel)`} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

export function Pair({ project }: { project: Project }) {
  return (
    <div className="pair">
      <Desktop project={project} sizes="(min-width: 900px) 420px, 88vw" />
      <Phone project={project} />
    </div>
  );
}

/** Hele pagina in een kader waarin je kunt scrollen. */
export function FullPage({ project }: { project: Project }) {
  return (
    <div className="mock full">
      <div className="mock-bar" aria-hidden="true"><i /><i /><i /><span>{project.name}</span></div>
      <div className="full-scroll" tabIndex={0} role="group" aria-label={`Hele pagina van ${project.name}, scrolbaar`}>
        <img src={`${base(project.slug)}-full.webp`} width={1100} height={project.fullHeight} alt={`${project.imageAlt}, hele pagina`} loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: Project["status"] }) {
  return <span className={`badge${status === "gerealiseerd" ? " real" : ""}`}>{status === "gerealiseerd" ? "Gerealiseerd" : "Conceptvoorbeeld"}</span>;
}
