import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Vanzator } from "@/components/Vanzator";
import { cautaAnunturi } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";

export const metadata: Metadata = { title: "Agenții imobiliare" };

export default function AgentiiPage() {
  const agentii = getAgentii();
  return (
    <>
      <Breadcrumbs items={[{ label: "Agenții imobiliare" }]} />
      <h1>Agenții imobiliare din România</h1>
      <p className="muted">
        Ești agenție? <Link href="/cont/inregistrare?tip=agentie">Creează un cont de agenție</Link> și publică toate ofertele tale.
      </p>
      <div className="grid">
        {agentii.map((a) => (
          <div key={a.id} className="card card-body">
            <Vanzator u={a} />
            <p className="muted small">
              {getOras(a.judet, a.oras)?.nume}, {getJudet(a.judet)?.nume} · {cautaAnunturi({ proprietar: a.id }).length} anunțuri
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
