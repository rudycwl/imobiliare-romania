import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatData } from "@/lib/fondatori";
import { getJudet, getOras } from "@/lib/geo";
import { cerePanou } from "@/lib/panou";
import { disponibile, unitatiDinJson } from "@/lib/proiecte-unitati";
import { LUNI_GRATUITE_PROIECT, PRET_PROIECT_LUNAR, lei } from "@/lib/tarife";

export const metadata: Metadata = { title: "Proiecte dezvoltatori", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProiectePanouPage() {
  await cerePanou();
  const proiecte = await db.proiect.findMany({ orderBy: { creatLa: "desc" } });
  const acum = new Date();
  return (
    <>
      <div className="titlu-cu-actiune">
        <h1>Proiecte dezvoltatori</h1>
        <Link href="/admin/proiecte/nou" className="buton">+ Proiect nou</Link>
      </div>
      <p className="muted">
        Oferta: {LUNI_GRATUITE_PROIECT} luni gratuit, apoi {lei(PRET_PROIECT_LUNAR)} pe lună per proiect, unități nelimitate.
        Când perioada gratuită s-a terminat, proiectul apare marcat „de facturat”.
      </p>
      {proiecte.length === 0 ? (
        <p className="muted">Nu există încă niciun proiect. Apasă „Proiect nou” ca să-l adaugi pe primul.</p>
      ) : (
        <div className="tabel-wrap">
          <table className="tabel">
            <thead>
              <tr><th>Proiect</th><th>Localitate</th><th>Unități</th><th>Gratuit până la</th><th>Stare</th></tr>
            </thead>
            <tbody>
              {proiecte.map((p) => {
                const u = unitatiDinJson(p.unitati);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/proiecte/${p.id}`}><strong>{p.nume}</strong></Link>
                      <br />
                      <span className="muted small">{p.dezvoltator} · {p.email}</span>
                    </td>
                    <td>{getOras(p.judet, p.oras)?.nume ?? p.oras}, {getJudet(p.judet)?.nume ?? p.judet}</td>
                    <td>{disponibile(u)} disponibile din {u.length}</td>
                    <td>
                      {formatData(p.gratuitPanaLa)}
                      {p.gratuitPanaLa < acum && <><br /><strong className="small">De facturat: {lei(PRET_PROIECT_LUNAR)} / lună</strong></>}
                    </td>
                    <td>
                      {p.activ ? <Link href={`/proiecte/${p.slug}`}>Activ, vezi pagina</Link> : <span className="muted">Oprit</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
