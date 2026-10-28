import Link from "next/link";
import { getJudet, getOras } from "@/lib/geo";
import { coperta, type ProiectPublic } from "@/lib/proiecte";
import { disponibile, pretMinim, textDisponibile } from "@/lib/proiecte-unitati";

const euro = (n: number) => `${new Intl.NumberFormat("ro-RO").format(n)} €`;

/** Cardul unui proiect de dezvoltator, în lista /proiecte și pe pagina județului. */
export function ProiectCard({ p }: { p: ProiectPublic }) {
  const img = coperta(p);
  const min = pretMinim(p.unitati);
  return (
    <Link href={`/proiecte/${p.slug}`} className="card card-proiect">
      <div className="card-img" style={{ background: img ? `url("${img}") center / cover no-repeat #64748b` : "#0b2545" }}>
        <span>Proiect nou</span>
        <span className="badge badge-dezvoltator">Dezvoltator</span>
      </div>
      <div className="card-body">
        {min !== null && <div className="pret">de la {euro(min)}</div>}
        <h3>{p.nume}</h3>
        <p className="muted">
          {[p.zona, getOras(p.judet, p.oras)?.nume, getJudet(p.judet)?.nume].filter(Boolean).join(", ")}
        </p>
        <p className="muted">{p.dezvoltator} · {textDisponibile(disponibile(p.unitati))}</p>
      </div>
    </Link>
  );
}

export function ListaProiecte({ proiecte }: { proiecte: ProiectPublic[] }) {
  return (
    <div className="grid">
      {proiecte.map((p) => (
        <ProiectCard key={p.id} p={p} />
      ))}
    </div>
  );
}
