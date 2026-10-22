import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatData } from "@/lib/fondatori";
import { lei } from "@/lib/tarife";
import { CadruCont } from "../CadruCont";

export const metadata: Metadata = { title: "Plăți și facturi", robots: { index: false } };

const STARI: Record<string, string> = { noua: "Neplătită", platita: "Plătită", respinsa: "Respinsă" };

export default async function PlatiPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const [comenzi, facturi] = await Promise.all([
    db.comanda.findMany({ where: { utilizatorId: u.id }, orderBy: { creatLa: "desc" }, take: 100 }),
    db.factura.findMany({ where: { utilizatorId: u.id, stare: { in: ["emisa", "stornata"] } }, select: { plataRef: true, linkPdf: true, seria: true, numar: true } }),
  ]);
  const factura = new Map(facturi.filter((f) => f.plataRef).map((f) => [f.plataRef!, f]));
  return (
    <CadruCont u={u}>
      <h1>Plăți și facturi</h1>
      {comenzi.length ? (
        <table className="tabel-plati">
          <thead>
            <tr><th>Data</th><th>Ce ai cumpărat</th><th>Sumă</th><th>Stare</th><th>Factură</th></tr>
          </thead>
          <tbody>
            {comenzi.map((c) => {
              const f = factura.get(c.id);
              return (
                <tr key={c.id}>
                  <td>{formatData(c.creatLa)}</td>
                  <td>{c.descriere}{c.anuntId && <> · <Link href={`/anunt/${c.anuntId}`}>anunțul #{c.anuntId}</Link></>}</td>
                  <td>{lei(c.sumaBani / 100)}</td>
                  <td>{STARI[c.stare] ?? c.stare}</td>
                  <td>
                    {f?.linkPdf ? <a href={f.linkPdf} target="_blank" rel="noopener">{f.seria} {f.numar}</a> : c.stare === "platita" ? <span className="muted small">Se emite</span> : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted">
          Nu ai plătit încă nimic. Plățile pentru promovări și abonamente apar aici, împreună cu facturile.
        </p>
      )}
      <p className="muted small">Ai o întrebare despre o plată? Scrie-ne de pe <Link href="/contact">pagina de contact</Link>.</p>
    </CadruCont>
  );
}
