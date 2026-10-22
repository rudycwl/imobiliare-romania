import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Vanzator } from "@/components/Vanzator";
import { Distribuie } from "@/components/Distribuie";
import { getAnunt } from "@/lib/anunturi";
import { formatPret, TIPURI, TRANZACTII } from "@/lib/etichete";
import { getJudet, getOras } from "@/lib/geo";

type Props = { params: Promise<{ id: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

// Anunțurile se generează la prima vizită și se reîmprospătează la cel mult 5 minute.
export const revalidate = 300;

// Listă goală: paginile se generează static la prima vizită (ISR), nu la build.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAnunt((await params).id);
  return { title: a?.titlu ?? "Anunț inexistent", description: a?.descriere };
}

export default async function AnuntPage({ params }: Props) {
  const a = await getAnunt((await params).id);
  if (!a) notFound();
  const j = getJudet(a.judet)!;
  const o = getOras(a.judet, a.oras)!;
  const u = a.proprietar;
  return (
    <>
      <Breadcrumbs
        items={[
          { href: `/${j.slug}`, label: j.nume },
          { href: `/${j.slug}/${o.slug}`, label: o.nume },
          { label: `Anunț #${a.id}` },
        ]}
      />
      <div className="anunt">
        <div className="anunt-img" style={{ background: a.imagine }}>
          <span>{TIPURI[a.tip]}</span>
        </div>
        <div>
          <h1>{a.titlu}</h1>
          <div className="pret mare">{formatPret(a)}</div>
          <table className="detalii">
            <tbody>
              <tr><th>Tranzacție</th><td>{TRANZACTII[a.tranzactie]}</td></tr>
              <tr><th>Tip</th><td>{TIPURI[a.tip]}</td></tr>
              <tr><th>Suprafață</th><td>{a.suprafata} m²</td></tr>
              {a.camere && <tr><th>Camere</th><td>{a.camere}</td></tr>}
              <tr><th>Localizare</th><td>{a.zona}, <Link href={`/${j.slug}/${o.slug}`}>{o.nume}</Link>, {j.nume}</td></tr>
              <tr><th>Publicat</th><td>{a.publicatLa.toLocaleDateString("ro-RO")}</td></tr>
            </tbody>
          </table>
          <p>{a.descriere}</p>
          <Vanzator u={u} />
          <a className="buton" href={`tel:${u.telefon}`}>Sună {u.telefon.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}</a>
          <Distribuie url={`${SITE}/anunt/${a.id}`} text={`${a.titlu} – ${formatPret(a)} pe CheiaMea`} />
        </div>
      </div>
    </>
  );
}
