import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { esteAdmin } from "@/lib/fondatori";

export const metadata: Metadata = { title: "Statistici surse", robots: { index: false } };
export const dynamic = "force-dynamic";

const nr = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

export default async function StatisticiPage({ searchParams }: { searchParams: Promise<{ zile?: string }> }) {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  const zile = Math.min(365, Math.max(1, Number((await searchParams).zile) || 30));
  const din = new Date(Date.now() - zile * 86_400_000);

  const [vizite, campanii, conturi, recomandatori] = await Promise.all([
    db.vizita.groupBy({ by: ["sursa"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { sursa: "desc" } }, take: 30 }),
    db.vizita.groupBy({ by: ["sursa", "mediu", "campanie"], where: { creatLa: { gte: din }, campanie: { not: null } }, _count: true, orderBy: { _count: { sursa: "desc" } }, take: 30 }),
    db.utilizator.groupBy({ by: ["sursa", "tip"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { sursa: "desc" } } }),
    db.utilizator.findMany({
      where: { recomandari: { some: { creatLa: { gte: din } } } },
      select: { nume: true, tip: true, _count: { select: { recomandari: true } } },
      orderBy: { recomandari: { _count: "desc" } },
      take: 20,
    }),
  ]);
  const totalVizite = vizite.reduce((s, v) => s + v._count, 0);

  return (
    <>
      <h1>Statistici pe surse</h1>
      <p className="muted">
        Ultimele {zile} zile ·{" "}
        {[7, 30, 90].map((z) => (
          <Link key={z} href={`?zile=${z}`} style={{ marginRight: 8 }}>{z} zile</Link>
        ))}
        · <Link href="/admin/invitatii">Invitații agenții</Link>
      </p>
      <p className="muted small">
        Pune <code>?utm_source=facebook&amp;utm_medium=grup&amp;utm_campaign=lansare</code> la sfârșitul linkurilor pe care le distribui ca să le vezi separat aici.
      </p>

      <h2>Vizite noi: {nr(totalVizite)}</h2>
      <table className="tabel">
        <thead><tr><th>Sursă</th><th>Vizite</th><th>%</th></tr></thead>
        <tbody>
          {vizite.map((v) => (
            <tr key={v.sursa}><td>{v.sursa}</td><td>{nr(v._count)}</td><td>{totalVizite ? Math.round((v._count / totalVizite) * 100) : 0}%</td></tr>
          ))}
        </tbody>
      </table>

      {campanii.length > 0 && (
        <>
          <h2>Campanii (UTM)</h2>
          <table className="tabel">
            <thead><tr><th>Sursă</th><th>Mediu</th><th>Campanie</th><th>Vizite</th></tr></thead>
            <tbody>
              {campanii.map((c) => (
                <tr key={`${c.sursa}-${c.mediu}-${c.campanie}`}><td>{c.sursa}</td><td>{c.mediu ?? "—"}</td><td>{c.campanie}</td><td>{nr(c._count)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Conturi noi pe surse</h2>
      <table className="tabel">
        <thead><tr><th>Sursă</th><th>Tip cont</th><th>Conturi</th></tr></thead>
        <tbody>
          {conturi.map((c) => (
            <tr key={`${c.sursa}-${c.tip}`}><td>{c.sursa ?? "necunoscut"}</td><td>{c.tip}</td><td>{nr(c._count)}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Cine a adus cele mai multe conturi</h2>
      <table className="tabel">
        <thead><tr><th>Cont</th><th>Tip</th><th>Recomandări (total)</th></tr></thead>
        <tbody>
          {recomandatori.map((r) => (
            <tr key={r.nume}><td>{r.nume}</td><td>{r.tip}</td><td>{nr(r._count.recomandari)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
