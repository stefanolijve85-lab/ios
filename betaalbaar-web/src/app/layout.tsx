import type { Metadata, Viewport } from "next";
import { brand, flags } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: `${brand.name} — ${brand.descriptor}`, template: `%s | ${brand.name}` },
  description: "Laat een professionele website maken voor €99 eenmalig + €59 per maand voor hosting en service. Bedragen exclusief btw.",
  // Indexering staat uit tot SITE_INDEXABLE=true (preview/testomgeving blijft buiten de index).
  robots: flags.indexable ? { index: true, follow: true } : { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf7f1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
