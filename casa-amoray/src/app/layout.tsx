import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { business, indexable, siteUrl } from "@/content/site";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const title = "Casa Amoray | Postpartummassage & ontspanningsmassage in Emmen";
const description =
  "Casa Amoray in Emmen: een warme, persoonlijke massagesalon speciaal voor vrouwen en moeders. Postpartummassage en ontspanningsmassage bij Winnie. Een moment voor jezelf.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Casa Amoray" },
  description,
  keywords: [
    "postpartummassage Emmen",
    "ontspanningsmassage Emmen",
    "massage voor vrouwen Emmen",
    "massage na bevalling Emmen",
    "Casa Amoray",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: business.name,
    title,
    description,
    images: [{ url: "/media/og-casa-amoray.jpg", width: 1200, height: 630, alt: "De salon van Casa Amoray" }],
  },
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#49352E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Markeer vóór de eerste paint dat JS draait: pas dan wordt de scrollytelling actief. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
