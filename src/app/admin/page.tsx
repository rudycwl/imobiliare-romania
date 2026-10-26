import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { esteAdmin } from "@/lib/fondatori";
import { panouDeschis } from "@/lib/panou";
import { iesiDinPanou } from "./actiuni";
import { FormularPanou } from "./FormularPanou";
import { SECTIUNI } from "./sectiuni";

export const metadata: Metadata = { title: "Panou de control", robots: { index: false } };
export const dynamic = "force-dynamic";

const nr = (n: number) => new Intl.NumberFormat("ro-RO").format(n);
const lei = (bani: number) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(bani / 100);

export default async function PanouPage() {
  const u = await utilizatorCurent();
  // Un cont obișnuit, logat pe site, nu află că pagina există.
  if (u && !esteAdmin(u.email)) notFound();
  // Emailul și parola se cer la fiecare intrare, chiar dacă administratorul e deja logat pe site.
  if (!u || !(await panouDeschis()))
    return (
      <div className="ingust">
        <h1>Panou de control</h1>
        <p className="muted">Intră cu emailul și parola de administrator. Panoul se închide singur după 2 ore sau când închizi browserul.</p>
        <FormularPanou />
      </div>
    );

  const acum = new Date();
  const zi = new Date(acum.getTime() - 86_400_000);
  const luna = new Date(acum.getTime() - 30 * 86_400_000);
  const [conturi, conturiNoi, agentii, active, deVerificat, raportari, retrageri, platiLuna, facturiNeemise, vizite] = await Promise.all([
    db.utilizator.count({ where: { stersLa: null } }),
    db.utilizator.count({ where: { stersLa: null, creatLa: { gte: zi } } }),
    db.utilizator.count({ where: { stersLa: null, tip: "agentie" } }),
    db.anunt.count({ where: { moderare: "ok", expiraLa: { gt: acum } } }),
    db.anunt.count({ where: { moderare: "verificare" } }),
    db.raportare.count({ where: { rezolvat: false } }),
    db.cerereRetragere.count({ where: { rezolvat: false } }),
    db.comanda.aggregate({ where: { stare: "platita", platitaLa: { gte: luna } }, _count: true, _sum: { sumaBani: true } }),
    db.factura.count({ where: { tip: "factura", stare: { in: ["in-asteptare", "eroare"] } } }),
    db.vizita.count({ where: { creatLa: { gte: zi } } }),
  ]);

  const cifre: { eticheta: string; valoare: string; href?: string; atentie?: boolean }[] = [
    { eticheta: "Conturi", valoare: nr(conturi), href: "/admin/conturi" },
    { eticheta: "Conturi noi (24 de ore)", valoare: nr(conturiNoi) },
    { eticheta: "Agenții înscrise", valoare: nr(agentii) },
    { eticheta: "Anunțuri active", valoare: nr(active) },
    { eticheta: "Anunțuri de verificat", valoare: nr(deVerificat), href: "/admin/moderare", atentie: deVerificat > 0 },
    { eticheta: "Raportări nerezolvate", valoare: nr(raportari), href: "/admin/moderare", atentie: raportari > 0 },
    { eticheta: "Plăți (30 de zile)", valoare: `${nr(platiLuna._count)} · ${lei(platiLuna._sum.sumaBani ?? 0)}`, href: "/admin/plati" },
    { eticheta: "Facturi neemise", valoare: nr(facturiNeemise), href: "/admin/facturi", atentie: facturiNeemise > 0 },
    { eticheta: "Cereri de retragere", valoare: nr(retrageri), href: "/admin/retrageri", atentie: retrageri > 0 },
    { eticheta: "Vizite (24 de ore, fără tine)", valoare: nr(vizite), href: "/admin/statistici" },
  ];

  return (
    <>
      <h1>Panou de control</h1>
      <p className="muted">
        Bine ai venit, {u.nume}. Cifrele de mai jos sunt de acum.{" "}
        <form action={iesiDinPanou} style={{ display: "inline" }}>
          <button type="submit" className="small">Ieși din panou</button>
        </form>
      </p>
      <div className="panou-cifre">
        {cifre.map((c) => {
          const continut = (
            <>
              <span className="muted small">{c.eticheta}</span>
              <strong>{c.valoare}</strong>
            </>
          );
          return (
            <div key={c.eticheta} className={`panou-cifra${c.atentie ? " atentie" : ""}`}>
              {c.href ? <Link href={c.href} style={{ color: "inherit" }}>{continut}</Link> : continut}
            </div>
          );
        })}
      </div>
      <h2>Secțiuni</h2>
      <div className="panou-sectiuni">
        {SECTIUNI.map((s) => (
          <Link key={s.href} href={s.href}>
            <strong>{s.titlu}</strong>
            <span className="muted small">{s.text}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
