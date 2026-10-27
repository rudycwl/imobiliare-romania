import Link from "next/link";
import { db } from "@/lib/db";

const TIPURI: Record<string, string> = { "persoana-fizica": "Persoană fizică", firma: "Firmă", agentie: "Agenție" };
const data = (d: Date) => new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }).format(d);

/** Conturile înscrise, cele mai noi primele. `complet` adaugă emailul, telefonul și numărul de anunțuri. */
export async function ListaConturi({ cauta, tip, limita, complet }: { cauta?: string; tip?: string; limita: number; complet?: boolean }) {
  const q = cauta?.trim();
  const conturi = await db.utilizator.findMany({
    where: {
      stersLa: null,
      ...(tip && TIPURI[tip] ? { tip } : {}),
      ...(q
        ? { OR: [{ nume: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { oras: { contains: q, mode: "insensitive" } }, { judet: { contains: q, mode: "insensitive" } }, { telefon: { contains: q } }] }
        : {}),
    },
    select: { id: true, slug: true, tip: true, nume: true, contact: true, email: true, telefon: true, oras: true, judet: true, creatLa: true, emailConfirmatLa: true, fondator: true, _count: { select: { anunturi: true } } },
    orderBy: { creatLa: "desc" },
    take: limita,
  });
  if (conturi.length === 0) return <p className="muted">{q || tip ? "Niciun cont nu se potrivește căutării." : "Încă nu s-a înscris nimeni."}</p>;
  return (
    <div className="tabel-wrap">
      <table className="tabel">
        <thead>
          <tr>
            <th>Nume</th><th>Tip</th><th>Localitate</th><th>Înscris</th>
            {complet && <><th>Email</th><th>Telefon</th><th>Anunțuri</th></>}
          </tr>
        </thead>
        <tbody>
          {conturi.map((c) => (
            <tr key={c.id}>
              <td>
                {c.tip === "agentie" ? <Link href={`/agentii/${c.slug}`}>{c.nume}</Link> : c.nume}
                {c.contact && <span className="muted small"> · {c.contact}</span>}
                {c.fondator && <span className="muted small"> · Fondatoare</span>}
              </td>
              <td>{TIPURI[c.tip] ?? c.tip}</td>
              <td>{c.oras}, jud. {c.judet}</td>
              <td>{data(c.creatLa)}</td>
              {complet && (
                <>
                  <td>{c.email ?? "—"}{c.email && !c.emailConfirmatLa && <span className="muted small"> (neconfirmat)</span>}</td>
                  <td>{c.telefon}</td>
                  <td>{c._count.anunturi}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
