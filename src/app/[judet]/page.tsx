import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, numarAnunturi, type Filtre as F } from "@/lib/anunturi";
import { getJudet } from "@/lib/geo";

type Props = { params: Promise<{ judet: string }>; searchParams: Promise<F> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const j = getJudet((await params).judet);
  return { title: j ? `Imobiliare județul ${j.nume}` : "Județ inexistent" };
}

export default async function JudetPage({ params, searchParams }: Props) {
  const j = getJudet((await params).judet);
  if (!j) notFound();
  const sp = await searchParams;
  const [{ anunturi, total }, numar] = await Promise.all([
    cautaAnunturi({ ...sp, judet: j.slug, oras: undefined }),
    numarAnunturi(j.slug),
  ]);
  return (
    <>
      <Breadcrumbs items={[{ label: j.nume }]} />
      <h1>Imobiliare {j.slug === "bucuresti" ? "București" : `județul ${j.nume}`}</h1>
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
      <ListaAnunturi anunturi={anunturi} total={total} />
    </>
  );
}
