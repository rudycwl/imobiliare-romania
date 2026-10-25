import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ORASE_IMPOZITE, REGULI_NATIONALE, caleImpozite } from "@/lib/impozite-locale";

export const metadata: Metadata = {
  title: "Impozitul pe clădiri în 2026, oraș cu oraș",
  description: "Cât e impozitul pe apartament sau casă în fiecare oraș: cota aprobată de consiliul local, bonificația, termenele și reducerile din 2026, cu link la hotărârea oficială.",
  alternates: { canonical: "/impozite-locale" },
};

export default function ImpoziteLocale() {
  return (
    <div className="legal pagina-legi">
      <Breadcrumbs items={[{ href: "/legislatie", label: "Legislație" }, { label: "Impozite locale" }]} />
      <p className="supratitlu">Impozite locale · 2026</p>
      <h1>Impozitul pe clădiri, oraș cu oraș</h1>
      <p className="muted">
        Cota se stabilește de consiliul local, în limitele din Codul fiscal. Aici găsești cota aprobată în fiecare oraș, cu link la hotărârea oficială.
        Informații generale: suma exactă o afli de la direcția de taxe a primăriei.
      </p>

      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr>
              <th>Oraș</th>
              <th className="num">Cotă locuințe (persoane fizice)</th>
              <th>Bonificație</th>
              <th>Hotărâre</th>
            </tr>
          </thead>
          <tbody>
            {ORASE_IMPOZITE.map((o) => (
              <tr key={caleImpozite(o)}>
                <td><Link href={caleImpozite(o)}><strong>{o.nume}</strong></Link></td>
                <td className="num"><strong className="pret">{o.cote[0].valoare}</strong></td>
                <td>{o.bonificatie.split(" pentru")[0]}</td>
                <td className="small">{o.hotarare.split(",")[0].split(" privind")[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">Adăugăm pe rând toate reședințele de județ, apoi celelalte orașe și comune, doar după ce verificăm hotărârea oficială a consiliului local. Până atunci, în orice localitate cota pentru locuințe e între 0,08% și 0,2%.</p>

      <h2>Reguli valabile în toată țara</h2>
      <div className="reguli">
        {REGULI_NATIONALE.map((r, i) => (
          <div key={r.titlu} className="regula">
            <span className="nr">{String(i + 1).padStart(2, "0")}</span>
            <h3>{r.titlu}</h3>
            <p>{r.text}</p>
            <p className="muted small">
              Sursa: <a href={r.sursa.url} target="_blank" rel="noopener noreferrer">{r.sursa.nume}</a>
            </p>
          </div>
        ))}
      </div>

      <p>
        <Link href="/legislatie">Noutăți legislative și reguli pentru cumpărători și vânzători →</Link>
      </p>
    </div>
  );
}
