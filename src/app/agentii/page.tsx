import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Vanzator } from "@/components/Vanzator";
import { getJudet, getOras } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";

export const metadata: Metadata = { title: "Agenții imobiliare" };
export const revalidate = 300;

export default async function AgentiiPage() {
  const agentii = await getAgentii();
  return (
    <>
      <Breadcrumbs items={[{ label: "Agenții imobiliare" }]} />
      <h1>Agenții imobiliare din România</h1>
      <p className="muted">
        Ești agenție? <Link href="/pentru-agentii">Intră în zona pentru agenții</Link> și publică toate ofertele tale.
      </p>
      <div className="grid">
        {agentii.map((a) => (
          <div key={a.id} className="card card-body">
            <Vanzator u={a} />
            <p className="muted small">
              {getOras(a.judet, a.oras)?.nume}, {getJudet(a.judet)?.nume} · {a.numarAnunturi} anunțuri
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
