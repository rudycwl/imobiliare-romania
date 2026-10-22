import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, type Filtre as F } from "@/lib/anunturi";
import { getJudet, getOras, JUDETE } from "@/lib/geo";

type Props = { params: Promise<{ judet: string; oras: string }>; searchParams: Promise<F> };

export function generateStaticParams() {
  return JUDETE.flatMap((j) => j.orase.map((o) => ({ judet: j.slug, oras: o.slug })));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const o = getOras(p.judet, p.oras);
  return { title: o ? `Imobiliare ${o.nume}` : "Oraș inexistent" };
}

export default async function OrasPage({ params, searchParams }: Props) {
  const p = await params;
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  if (!j || !o) notFound();
  const sp = await searchParams;
  const anunturi = cautaAnunturi({ ...sp, judet: j.slug, oras: o.slug });
  return (
    <>
      <Breadcrumbs items={[{ href: `/${j.slug}`, label: j.nume }, { label: o.nume }]} />
      <h1>Imobiliare {o.nume}</h1>
      <Filtre valori={sp} action={`/${j.slug}/${o.slug}`} />
      <ListaAnunturi anunturi={anunturi} />
    </>
  );
}
