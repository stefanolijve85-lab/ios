import type { Metadata } from "next";
import { Closing, ProjectCards } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Voorbeelden van websites",
  description: "Bekijk drie conceptvoorbeelden: een technologiemerk, een salon en een kaas- en delicatessenwinkel. Elk met een eigen ontwerprichting.",
  alternates: { canonical: "/voorbeelden" },
};

export default function Page() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Voorbeelden</p>
          <h1>Zo kan jouw website eruitzien.</h1>
          <p className="lead">Drie ontwerprichtingen voor drie heel verschillende bedrijven. Het zijn conceptvoorbeelden: ze laten ontwerpdoelen zien, geen behaalde resultaten.</p>
        </div>
      </section>
      <section className="section plain" style={{ paddingTop: 0 }}><div className="wrap"><ProjectCards /></div></section>
      <Closing />
    </>
  );
}
