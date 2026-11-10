import type { Metadata } from "next";
import Wizard from "@/components/wizard/Wizard";

export const metadata: Metadata = {
  title: "Stel mijn website samen",
  description: "Visuele intake: kies stap voor stap wat bij je bedrijf past en verstuur je aanvraag.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Wizard />;
}
