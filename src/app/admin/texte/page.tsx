import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { citesteTexte, NR_BANDA } from "@/lib/setari";
import { FormularTexte } from "./Formular";

export const metadata: Metadata = { title: "Texte site", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TextePage() {
  const u = await cerePanou();
  return (
    <div className="ingust" style={{ maxWidth: 820 }}>
      <h1>Texte site</h1>
      <p className="muted">Schimbi textele direct de aici, fără programator. După „Salvează”, se văd pe site imediat.</p>
      <FormularTexte texte={await citesteTexte()} nrBanda={NR_BANDA} />
    </div>
  );
}
