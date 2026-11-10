import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Fraunces, Parisienne } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { Greeting } from "@/components/Greeting";
import { ConceptBadge } from "@/components/ConceptBadge";
import { winkel } from "@/content/winkel";
import { basisUrl, localBusinessJsonLd, paginaMeta } from "@/lib/seo";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", axes: ["SOFT", "WONK", "opsz"], display: "swap" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const script = Parisienne({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(basisUrl()),
  ...paginaMeta({
    titel: "Bij Tanja — Kaaswinkel in Emmen | Kaas, noten & meer in Angelslo",
    beschrijving:
      "Bij Tanja in Winkelcentrum Angelslo, Emmen: heerlijke kazen, wijn en bubbels, speciaalbier, noten, snoep, worstjes, delicatessen en cadeaupakketten. Kom gezellig langs!",
    pad: "/",
  }),
  title: {
    default: "Bij Tanja — Kaaswinkel in Emmen | Kaas, noten & meer in Angelslo",
    template: `%s | ${winkel.naam}, Emmen`,
  },
  applicationName: winkel.naam,
  keywords: ["Bij Tanja Emmen", "kaaswinkel Emmen", "kaaswinkel Angelslo", "delicatessen Emmen", "cadeaupakketten Emmen", "kaas en wijn Emmen"],
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#262E1B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${serif.variable} ${sans.variable} ${script.variable} ${hand.variable}`}>
      <body>
        <Providers>
          <Header />
          <main id="inhoud" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <Greeting />
          <ConceptBadge />
        </Providers>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
