import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListaProiecte } from "@/components/ProiectCard";
import { getJudet, JUDETE } from "@/lib/geo";
import { proiecteActive } from "@/lib/proiecte";

type Props = { searchParams: Promise<{ judet?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const j = getJudet((await searchParams).judet ?? "");
  return {
    title: j ? `Proiecte imobiliare noi în ${j.nume}` : "Proiecte imobiliare noi",
    description: "Ansambluri rezidențiale noi, direct de la dezvoltatori: unități disponibile, prețuri și contact.",
    alternates: { canonical: "/proiecte" },
  };
}

export default async function ProiectePage({ searchParams }: Props) {
  const j = getJudet((await searchParams).judet ?? "");
  const proiecte = await proiecteActive(j?.slug);
  return (
    <>
      <Breadcrumbs items={[{ label: "Proiecte noi" }]} />
      <h1>Proiecte imobiliare noi{j ? ` în ${j.slug === "bucuresti" ? "București" : `județul ${j.nume}`}` : ""}</h1>
      <p className="muted">Ansambluri rezidențiale prezentate direct de dezvoltatori: unitățile disponibile, prețurile și contactul dezvoltatorului.</p>
      <form className="filtre" action="/proiecte">
        <select name="judet" defaultValue={j?.slug ?? ""} aria-label="Județul">
          <option value="">Toate județele</option>
          {JUDETE.map((x) => (
            <option key={x.slug} value={x.slug}>{x.nume}</option>
          ))}
        </select>
        <button type="submit">Arată</button>
      </form>
      {proiecte.length ? (
        <ListaProiecte proiecte={proiecte} />
      ) : (
        <p className="muted">
          {j ? `Nu avem încă proiecte noi în ${j.nume}. ` : "Nu avem încă proiecte noi publicate. "}
          {j && <><Link href="/proiecte">Vezi toate proiectele</Link> sau </>}
          <Link href={j ? `/${j.slug}` : "/cautare"}>caută printre anunțuri</Link>.
        </p>
      )}
      <div className="oferta">
        <h2>Ești dezvoltator imobiliar?</h2>
        <p>Prezintă-ți proiectul pe CheiaMea, cu toate unitățile și cererile clienților direct pe email.</p>
        <Link href="/preturi#dezvoltatori" className="buton">Vezi oferta pentru dezvoltatori</Link>
      </div>
    </>
  );
}
