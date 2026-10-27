import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CalculatorCredit } from "@/components/CalculatorCredit";
import { CalculatorImpozit } from "@/components/CalculatorImpozit";

export const metadata: Metadata = {
  title: "Calculatoare: rata la credit și impozitul pe locuință în 2026",
  description: "Calculează rata lunară la un credit ipotecar și impozitul anual pe apartament sau casă în 2026, după Codul fiscal și cota primăriei tale.",
  alternates: { canonical: "/calculatoare" },
};

export default function CalculatoarePage() {
  return (
    <div className="legal pagina-legi">
      <Breadcrumbs items={[{ label: "Calculatoare" }]} />
      <h1>Calculatoare</h1>
      <p className="muted">Estimări rapide, fără cont. Nu salvăm nimic din ce scrii aici.</p>

      <h2 id="credit">Cât ai plăti pe lună la credit</h2>
      <CalculatorCredit />

      <h2 id="impozit">Cât e impozitul pe locuință în 2026</h2>
      <p className="muted">
        Cota o stabilește primăria. Pentru orașele verificate o găsești pe <Link href="/impozite-locale">pagina impozitelor locale</Link>,
        unde calculatorul vine deja completat.
      </p>
      <CalculatorImpozit />
    </div>
  );
}
