import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { LinkHarta } from "@/components/harta/LinkHarta";
import { SalveazaCautarea } from "@/components/SalveazaCautarea";
import { curataFiltre } from "@/lib/cautari";
import { ListaAnunturi } from "@/components/AnuntCard";
import { SeoZona } from "@/components/SeoZona";
import { cautaAnunturi, statisticiZona, type Filtre as F } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";

type Props = { params: Promise<{ judet: string; oras: string }>; searchParams: Promise<F> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  if (!j || !o) return { title: "Oraș inexistent" };
  const s = await statisticiZona(j.slug, o.slug);
  const pret = s.pretMp ? ` Preț mediu apartamente: ${new Intl.NumberFormat("ro-RO").format(s.pretMp)} €/m².` : "";
  const title = `Imobiliare ${o.nume}: apartamente și case de vânzare și închiriat`;
  const description = `${s.vanzare + s.inchiriere} anunțuri imobiliare în ${o.nume}, județul ${j.nume}: ${s.vanzare} de vânzare, ${s.inchiriere} de închiriat.${pret} Anunțuri de la proprietari și agenții.`;
  const url = `${SITE}/${j.slug}/${o.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

export default async function OrasPage({ params, searchParams }: Props) {
  const p = await params;
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  if (!j || !o) notFound();
  const sp = await searchParams;
  const [{ anunturi, total }, s] = await Promise.all([cautaAnunturi({ ...sp, judet: j.slug, oras: o.slug }), statisticiZona(j.slug, o.slug)]);
  return (
    <>
      <Breadcrumbs items={[{ href: `/${j.slug}`, label: j.nume }, { label: o.nume }]} />
      <div className="titlu-cu-actiune">
        <h1>Imobiliare {o.nume}</h1>
        <LinkHarta filtre={{ ...sp, judet: j.slug, oras: o.slug }} />
      </div>
      <Filtre valori={sp} action={`/${j.slug}/${o.slug}`} />
      <SalveazaCautarea filtre={curataFiltre({ ...sp, judet: j.slug, oras: o.slug })} />
      <ListaAnunturi anunturi={anunturi} total={total} />
      <SeoZona
        loc={o.nume}
        s={s}
        indice={`/indice-preturi/${j.slug}/${o.slug}`}
        breadcrumb={[
          { name: "Acasă", url: SITE },
          { name: j.nume, url: `${SITE}/${j.slug}` },
          { name: o.nume, url: `${SITE}/${j.slug}/${o.slug}` },
        ]}
      />
    </>
  );
}
