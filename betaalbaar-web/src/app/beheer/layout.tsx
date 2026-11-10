import type { Metadata } from "next";

export const metadata: Metadata = { title: "Beheer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <main className="admin"><div className="wrap">{children}</div></main>;
}
