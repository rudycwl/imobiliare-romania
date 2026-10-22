import Link from "next/link";
import type { Anunt } from "@/modules/types";
import { formatPret, TIPURI } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { getUtilizator, TIPURI_UTILIZATOR } from "@/lib/utilizatori";

export function AnuntCard({ a }: { a: Anunt }) {
  const oras = getOras(a.judet, a.oras);
  const judet = getJudet(a.judet);
  const u = getUtilizator(a.proprietarId);
  return (
    <Link href={`/anunt/${a.id}`} className="card">
      <div className="card-img" style={{ background: a.imagine }}>
        <span>{TIPURI[a.tip]}</span>
        {u && <span className={`badge badge-${u.tip}`}>{TIPURI_UTILIZATOR[u.tip]}</span>}
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

export function ListaAnunturi({ anunturi }: { anunturi: Anunt[] }) {
  if (!anunturi.length) return <p className="muted">Niciun anunț nu corespunde filtrelor.</p>;
  return (
    <>
      <p className="muted">{anunturi.length} anunțuri găsite</p>
      <div className="grid">
        {anunturi.map((a) => (
          <AnuntCard key={a.id} a={a} />
        ))}
      </div>
    </>
  );
}
