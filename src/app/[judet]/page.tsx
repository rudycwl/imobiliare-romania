import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { LinkHarta } from "@/components/harta/LinkHarta";
import { SalveazaCautarea } from "@/components/SalveazaCautarea";
import { curataFiltre } from "@/lib/cautari";
import { ListaAnunturi } from "@/components/AnuntCard";
import { SeoZona } from "@/components/SeoZona";
import { cautaAnunturi, numarAnunturi, statisticiZona, type Filtre as F } from "@/lib/anunturi";
import { getJudet } from "@/lib/geo";
import { textAnunturi } from "@/lib/etichete";

type Props = { params: Promise<{ judet: string }>; searchParams: Promise<F> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";
const numeZona = (j: { slug: string; nume: string }) => (j.slug === "bucuresti" ? "București" : `județul ${j.nume}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const j = getJudet((await params).judet);
  if (!j) return { title: "Județ inexistent" };
  const s = await statisticiZona(j.slug);
  const pret = s.pretMp ? ` Preț mediu apartamente: ${new Intl.NumberFormat("ro-RO").format(s.pretMp)} €/m².` : "";
  const title = `Imobiliare ${numeZona(j)}: anunțuri de vânzare și închiriere`;
  const description = `${textAnunturi(s.vanzare + s.inchiriere, "imobiliare")} în ${numeZona(j)}, în ${j.orase.length} localități: ${s.vanzare} la vânzare și ${s.inchiriere} la închiriere.${pret}`;
  const url = `${SITE}/${j.slug}`;
  // Fără anunțuri pagina e goală: Google n-o indexează până apare primul anunț (vezi și sitemap.ts).
  const gol = s.vanzare + s.inchiriere === 0;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url }, robots: gol ? { index: false } : undefined };
}

export default async function JudetPage({ params, searchParams }: Props) {
  const j = getJudet((await params).judet);
  if (!j) notFound();
  const sp = await searchParams;
  const [{ anunturi, total }, numar, s] = await Promise.all([
    cautaAnunturi({ ...sp, judet: j.slug, oras: undefined }),
    numarAnunturi(j.slug),
    statisticiZona(j.slug),
  ]);
  return (
    <>
      <Breadcrumbs items={[{ label: j.nume }]} />
      <div className="titlu-cu-actiune">
        <h1>Imobiliare {j.slug === "bucuresti" ? "București" : `județul ${j.nume}`}</h1>
        <LinkHarta filtre={{ ...sp, judet: j.slug, oras: undefined }} />
      </div>
      <ul className="judete">
        {j.orase.map((o) => (
          <li key={o.slug}>
            <Link href={`/${j.slug}/${o.slug}`}>
              <strong>{o.nume}</strong> <span className="muted">({numar[o.slug] ?? 0})</span>
            </Link>
          </li>
        ))}
      </ul>
      <Filtre valori={sp} action={`/${j.slug}`} />
      <SalveazaCautarea filtre={curataFiltre({ ...sp, judet: j.slug, oras: undefined })} />
      <ListaAnunturi anunturi={anunturi} total={total} />
      <SeoZona loc={numeZona(j)} s={s} breadcrumb={[{ name: "Acasă", url: SITE }, { name: j.nume, url: `${SITE}/${j.slug}` }]} />
    </>
  );
}
