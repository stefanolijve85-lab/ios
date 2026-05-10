import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trustline — The AI trust layer for business payments",
  description:
    "Detect fake, manipulated, and AI-generated invoices before money leaves your business. Trust scores, supplier intelligence, and explainable risk analysis for accounts payable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-trust-grid">{children}</body>
    </html>
  );
}
