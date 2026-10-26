import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { REGULI_NATIONALE, caleImpozite } from "@/lib/impozite-locale";
import { citesteImpozite, gasesteImpozite } from "@/lib/continut-db";

type Props = { params: Promise<{ loc: string[] }> };

const gaseste = (loc: string[]) => gasesteImpozite(`/impozite-locale/${loc.join("/")}`);

// Un oraș ascuns din panou dă 404; dacă e arătat din nou, pagina se face la prima cerere.
export async function generateStaticParams() {
  return (await citesteImpozite()).map((o) => ({ loc: o.oras ? [o.judet, o.oras] : [o.judet] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await gaseste((await params).loc);
  if (!o) return { title: "Oraș inexistent" };
  const title = `Impozit clădiri ${o.nume} ${o.an}: cota ${o.cote[0].valoare}, termene și reduceri`;
  const description = `Impozitul pe apartament sau casă în ${o.nume} în ${o.an}: cota aprobată de consiliul local (${o.cote[0].valoare} la locuințe), bonificația, termenele de plată și reducerile, cu link la hotărârea oficială.`;
  return { title, description, alternates: { canonical: caleImpozite(o) } };
}

export default async function ImpoziteOrasPage({ params }: Props) {
  const o = await gaseste((await params).loc);
  if (!o) notFound();
  const anunturi = o.oras ? `/${o.judet}/${o.oras}` : `/${o.judet}`;
  return (
    <div className="legal pagina-legi">
      <Breadcrumbs items={[{ href: "/legislatie", label: "Legislație" }, { href: "/impozite-locale", label: "Impozite locale" }, { label: o.nume }]} />
      <p className="supratitlu">Impozite locale · {o.an} · verificat {o.verificat}</p>
      <h1>Impozitul pe clădiri în {o.nume}, {o.an}</h1>
      <p className="muted">{o.hotarare}.</p>

      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr><th>Ce fel de clădire</th><th className="num">Cotă</th></tr>
          </thead>
          <tbody>
            {o.cote.map((c) => (
              <tr key={c.ce}><td>{c.ce}</td><td className="num"><strong className="pret">{c.valoare}</strong></td></tr>
            ))}
            <tr><td>Bonificație</td><td className="num">{o.bonificatie}</td></tr>
            <tr><td>Termene de plată</td><td className="num">31 martie și 30 septembrie</td></tr>
          </tbody>
        </table>
      </div>

      {o.note.length > 0 && (
        <>
          <h2>De reținut</h2>
          <ul>{o.note.map((n) => <li key={n}>{n}</li>)}</ul>
        </>
      )}

      <h2>Surse oficiale</h2>
      <ul>
        {o.surse.map((s) => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.nume}</a></li>
        ))}
      </ul>

      <h2>Reguli valabile în toată țara</h2>
      <ul>
        {REGULI_NATIONALE.map((r) => (
          <li key={r.titlu}>
            <strong>{r.titlu}.</strong> {r.text}{" "}
            <a href={r.sursa.url} target="_blank" rel="noopener noreferrer" className="small">({r.sursa.nume})</a>
          </li>
        ))}
      </ul>

      <p className="muted small">
        Informații generale, nu consultanță fiscală. Suma exactă pentru clădirea ta o afli de la direcția de impozite și taxe locale.
      </p>
      <p>
        <Link href={anunturi} className="buton">Anunțuri imobiliare în {o.nume}</Link>{" "}
        <Link href="/impozite-locale">Alte orașe →</Link>
      </p>
    </div>
  );
}
