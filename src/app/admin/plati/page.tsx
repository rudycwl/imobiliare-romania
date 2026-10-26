import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { db } from "@/lib/db";
import { stergePlati } from "./actiuni";

export const metadata: Metadata = { title: "Plăți", robots: { index: false } };
export const dynamic = "force-dynamic";

const lei = (bani: number) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(bani / 100);
const cand = (d: Date) =>
  new Intl.DateTimeFormat("ro-RO", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);
const STARE: Record<string, string> = { noua: "Neplătită", platita: "✅ Plătită", respinsa: "Respinsă" };

export default async function PlatiPage({ searchParams }: { searchParams: Promise<{ sterse?: string }> }) {
  const u = await cerePanou();
  const sterse = (await searchParams).sterse;
  const comenzi = await db.comanda.findMany({
    orderBy: { creatLa: "desc" },
    take: 300,
    include: { utilizator: { select: { nume: true, email: true } } },
  });
  const facturi = await db.factura.findMany({
    where: { plataRef: { in: comenzi.map((c) => c.id) } },
    select: { plataRef: true, seria: true, numar: true, stare: true },
  });
  const factura = (id: string) => facturi.find((f) => f.plataRef === id && (f.seria || f.stare === "emisa" || f.stare === "stornata"));
  // Bifate din oficiu doar plățile neîncasate; o plată încasată fără factură se bifează de mână, după verificare.
  const deTest = comenzi.filter((c) => !factura(c.id));
  return (
    <>
      <h1>Plăți</h1>
      {sterse !== undefined && <p className="succes">Gata: am șters {sterse} {sterse === "1" ? "plată" : "plăți"} de test.</p>}
      <p className="muted">
        Toate plățile cu cardul (NETOPIA), cele mai noi primele. Cele fără factură emisă se pot șterge (ex. testele); cele neplătite sunt bifate din oficiu, iar o plată „Plătită” se bifează doar după ce verifici că e test.
        Plățile facturate nu se pot șterge: factura se anulează prin stornare, din <Link href="/admin/facturi">Facturi</Link>.
      </p>
      {comenzi.length === 0 && <p className="succes">Nicio plată.</p>}
      {comenzi.length > 0 && (
        <form action={stergePlati}>
          <table className="tabel">
            <thead>
              <tr><th></th><th>Data</th><th>Client</th><th>Ce a cumpărat</th><th>Stare</th><th>Factura</th><th>Sumă</th></tr>
            </thead>
            <tbody>
              {comenzi.map((c) => {
                const f = factura(c.id);
                return (
                  <tr key={c.id}>
                    <td>{!f && <input type="checkbox" name="id" value={c.id} defaultChecked={c.stare !== "platita"} aria-label="Șterge" />}</td>
                    <td>{cand(c.creatLa)}</td>
                    <td>{c.utilizator.nume}<div className="muted small">{c.utilizator.email}</div></td>
                    <td>{c.descriere}</td>
                    <td>{STARE[c.stare] ?? c.stare}</td>
                    <td>{f ? `${f.seria ?? ""} ${f.numar ?? ""}`.trim() || f.stare : "–"}</td>
                    <td>{lei(c.sumaBani)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deTest.length > 0 && (
            <p>
              <button type="submit">Șterge plățile bifate ({deTest.length})</button>
            </p>
          )}
        </form>
      )}
    </>
  );
}
