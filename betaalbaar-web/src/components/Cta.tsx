"use client";
import Link from "next/link";
import { START_HREF } from "@/config/site";
import { track, type EventName } from "@/lib/analytics";

export function Cta({ location, label = "Start mijn website", small }: { location: string; label?: string; small?: boolean }) {
  return (
    <Link href={START_HREF} className={`btn btn-primary${small ? " btn-sm" : ""}`} onClick={() => track("cta_click", { location })}>
      {label}
    </Link>
  );
}

export function TrackLink({ href, event, project, className, children }: { href: string; event: EventName; project?: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className} onClick={() => track(event, { project })}>
      {children}
    </Link>
  );
}
