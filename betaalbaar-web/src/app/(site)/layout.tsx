import { Footer, Header, MobileBar, PreviewBanner } from "@/components/Chrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="has-bar">
      <a href="#inhoud" className="skip">Naar de inhoud</a>
      <PreviewBanner />
      <Header />
      <main id="inhoud">{children}</main>
      <Footer />
      <MobileBar />
    </div>
  );
}
