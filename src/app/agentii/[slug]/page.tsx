import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Vanzator } from "@/components/Vanzator";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { getAgentie, getAgentii } from "@/lib/utilizatori";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAgentii().map((a) => ({ slug: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getAgentie((await params).slug);
  return { title: a?.nume ?? "Agenție inexistentă" };
}

export default async function AgentiePage({ params }: Props) {
  const a = getAgentie((await params).slug);
  if (!a) notFound();
  return (
    <>
      <Breadcrumbs items={[{ href: "/agentii", label: "Agenții" }, { label: a.nume }]} />
      <Vanzator u={a} />
      <p className="muted">
        {getOras(a.judet, a.oras)?.nume}, {getJudet(a.judet)?.nume} · Tel. {a.telefon}
      </p>
      <ListaAnunturi anunturi={cautaAnunturi({ proprietar: a.id })} />
    </>
  );
}
