import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Statistici surse", robots: { index: false } };
export const dynamic = "force-dynamic";

const nr = (n: number) => new Intl.NumberFormat("ro-RO").format(n);
const ora = (d: Date) => new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }).format(d);

export default async function StatisticiPage({ searchParams }: { searchParams: Promise<{ zile?: string }> }) {
  const u = await cerePanou();
  const zile = Math.min(365, Math.max(1, Number((await searchParams).zile) || 30));
  const din = new Date(Date.now() - zile * 86_400_000);

  const [vizite, campanii, conturi, recomandatori, platforme, browsere, localitati, ultimele] = await Promise.all([
    db.vizita.groupBy({ by: ["sursa"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { sursa: "desc" } }, take: 30 }),
    db.vizita.groupBy({ by: ["sursa", "mediu", "campanie"], where: { creatLa: { gte: din }, campanie: { not: null } }, _count: true, orderBy: { _count: { sursa: "desc" } }, take: 30 }),
    db.utilizator.groupBy({ by: ["sursa", "tip"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { sursa: "desc" } } }),
    db.utilizator.findMany({
      where: { recomandari: { some: { creatLa: { gte: din } } } },
      select: { nume: true, tip: true, _count: { select: { recomandari: true } } },
      orderBy: { recomandari: { _count: "desc" } },
      take: 20,
    }),
    db.vizita.groupBy({ by: ["dispozitiv", "sistem"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { sistem: "desc" } }, take: 20 }),
    db.vizita.groupBy({ by: ["browser"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { browser: "desc" } }, take: 15 }),
    db.vizita.groupBy({ by: ["oras", "regiune", "tara"], where: { creatLa: { gte: din } }, _count: true, orderBy: { _count: { oras: "desc" } }, take: 40 }),
    db.vizita.findMany({ orderBy: { creatLa: "desc" }, take: 50 }),
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

      <p className="muted small">Platforma și localitatea se înregistrează din 26.10.2026; vizitele mai vechi apar ca „necunoscut”. Localitatea e aproximativă (după adresa de internet; pe date mobile apare des alt oraș). Vizitele din contul de administrator nu se numără. Localitățile: <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer">IP Geolocation by DB-IP</a> (CC BY 4.0).</p>

      <h2>Pe platformă</h2>
      <table className="tabel">
        <thead><tr><th>Dispozitiv</th><th>Sistem</th><th>Vizite</th></tr></thead>
        <tbody>
          {platforme.map((p) => (
            <tr key={`${p.dispozitiv}-${p.sistem}`}><td>{p.dispozitiv ?? "necunoscut"}</td><td>{p.sistem ?? "—"}</td><td>{nr(p._count)}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Pe browser</h2>
      <table className="tabel">
        <thead><tr><th>Browser</th><th>Vizite</th></tr></thead>
        <tbody>
          {browsere.map((b) => (
            <tr key={b.browser ?? "-"}><td>{b.browser ?? "necunoscut"}</td><td>{nr(b._count)}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Pe localitate</h2>
      <table className="tabel">
        <thead><tr><th>Localitate</th><th>Județ / regiune</th><th>Țara</th><th>Vizite</th></tr></thead>
        <tbody>
          {localitati.map((l) => (
            <tr key={`${l.oras}-${l.regiune}-${l.tara}`}><td>{l.oras ?? "necunoscut"}</td><td>{l.regiune ?? "—"}</td><td>{l.tara ?? "—"}</td><td>{nr(l._count)}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Ultimele 50 de vizite</h2>
      <div className="tabel-wrap">
        <table className="tabel">
          <thead><tr><th>Când</th><th>Sursă</th><th>Platformă</th><th>Localitate</th><th>Prima pagină</th></tr></thead>
          <tbody>
            {ultimele.map((v) => (
              <tr key={v.id}>
                <td>{ora(v.creatLa)}</td>
                <td>{v.sursa}</td>
                <td>{v.dispozitiv ? `${v.dispozitiv}, ${v.sistem}, ${v.browser}` : "—"}</td>
                <td>{v.oras ? `${v.oras}${v.regiune ? `, ${v.regiune}` : ""}${v.tara && v.tara !== "RO" ? ` (${v.tara})` : ""}` : "—"}</td>
                <td>{v.pagina ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
