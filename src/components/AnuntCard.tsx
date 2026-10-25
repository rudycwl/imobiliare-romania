import Link from "next/link";
import type { AnuntCuProprietar } from "@/lib/anunturi";
import { formatLei, formatPret, textAnunturi, TIPURI, TIPURI_UTILIZATOR } from "@/lib/etichete";
import { cursEuro } from "@/lib/curs";
import { getJudet, getOras } from "@/lib/geo";
import { Favorit } from "./Favorit";

export function AnuntCard({ a, curs = null }: { a: AnuntCuProprietar; curs?: number | null }) {
  const oras = getOras(a.judet, a.oras);
  const judet = getJudet(a.judet);
  const u = a.proprietar;
  return (
    <Link href={`/anunt/${a.id}`} className={a.evidentiat ? "card evidentiat" : "card"}>
      <div className="card-img" style={{ background: a.imagine }}>
        <span>{TIPURI[a.tip]}</span>
        <span className={`badge badge-${u.tip}`}>{u.fondator ? "⭐ " : ""}{TIPURI_UTILIZATOR[u.tip]}</span>
        <Favorit id={a.id} />
      </div>
      <div className="card-body">
        {(a.promovat || a.evidentiat) && <span className="eticheta-promo">{a.promovat ? "Promovat" : "Evidențiat"}</span>}
        <div className="pret">{formatPret(a)}</div>
        {curs && <div className="pret-lei">{formatLei(a, curs)}</div>}
        <h3>{a.titlu}</h3>
        <p className="muted">
          {oras?.nume}, {judet?.nume} · {a.suprafata} m²{a.camere ? ` · ${a.camere} cam.` : ""}
        </p>
      </div>
    </Link>
  );
}

export async function ListaAnunturi({ anunturi, total }: { anunturi: AnuntCuProprietar[]; total?: number }) {
  if (!anunturi.length) return <p className="muted">Niciun anunț nu corespunde filtrelor.</p>;
  const curs = await cursEuro();
  const n = total ?? anunturi.length;
  return (
    <>
      <p className="muted">
        {textAnunturi(n, n === 1 ? "găsit" : "găsite")}{n > anunturi.length ? `, primele ${anunturi.length} afișate` : ""}
      </p>
      <div className="grid">
        {anunturi.map((a) => (
          <AnuntCard key={a.id} a={a} curs={curs} />
        ))}
      </div>
    </>
  );
}
