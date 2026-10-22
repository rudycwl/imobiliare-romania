import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Vanzator } from "@/components/Vanzator";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { getAgentie } from "@/lib/utilizatori";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

// Listă goală: paginile se generează static la prima vizită (ISR), nu la build.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAgentie((await params).slug);
  return { title: a?.nume ?? "Agenție inexistentă" };
}

export default async function AgentiePage({ params }: Props) {
  const a = await getAgentie((await params).slug);
  if (!a) notFound();
  const { anunturi, total } = await cautaAnunturi({ proprietar: a.id });
  return (
    <>
      <Breadcrumbs items={[{ href: "/agentii", label: "Agenții" }, { label: a.nume }]} />
      <Vanzator u={a} />
      <p className="muted">
        {getOras(a.judet, a.oras)?.nume}, {getJudet(a.judet)?.nume} · Tel. {a.telefon}
      </p>
      <ListaAnunturi anunturi={anunturi} total={total} />
    </>
  );
}
