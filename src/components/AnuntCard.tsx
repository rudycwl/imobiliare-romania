import Link from "next/link";
import type { AnuntCuProprietar } from "@/lib/anunturi";
import { formatPret, TIPURI, TIPURI_UTILIZATOR } from "@/lib/etichete";
import { getJudet, getOras } from "@/lib/geo";

export function AnuntCard({ a }: { a: AnuntCuProprietar }) {
  const oras = getOras(a.judet, a.oras);
  const judet = getJudet(a.judet);
  const u = a.proprietar;
  return (
    <Link href={`/anunt/${a.id}`} className="card">
      <div className="card-img" style={{ background: a.imagine }}>
        <span>{TIPURI[a.tip]}</span>
        <span className={`badge badge-${u.tip}`}>{TIPURI_UTILIZATOR[u.tip]}</span>
      </div>
      <div className="card-body">
        <div className="pret">{formatPret(a)}</div>
        <h3>{a.titlu}</h3>
        <p className="muted">
          {oras?.nume}, {judet?.nume} · {a.suprafata} m²{a.camere ? ` · ${a.camere} cam.` : ""}
        </p>
      </div>
    </Link>
  );
}

export function ListaAnunturi({ anunturi, total }: { anunturi: AnuntCuProprietar[]; total?: number }) {
  if (!anunturi.length) return <p className="muted">Niciun anunț nu corespunde filtrelor.</p>;
  const n = total ?? anunturi.length;
  return (
    <>
      <p className="muted">
        {n} anunțuri găsite{n > anunturi.length ? `, primele ${anunturi.length} afișate` : ""}
      </p>
      <div className="grid">
        {anunturi.map((a) => (
          <AnuntCard key={a.id} a={a} />
        ))}
      </div>
    </>
  );
}
