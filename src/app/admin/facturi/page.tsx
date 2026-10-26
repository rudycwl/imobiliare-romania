import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { cotaTva, listaFacturi, lunaCurenta, type Cumparator } from "@/lib/facturare";
import { oblioConfigurat } from "@/lib/facturare/oblio";
import { eFactura, reemite, storneaza } from "./actiuni";

export const metadata: Metadata = { title: "Facturi", robots: { index: false } };
export const dynamic = "force-dynamic";

const lei = (bani: number) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(bani / 100);
const zi = (d: Date) => new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" }).format(d);

const STARE: Record<string, string> = {
  "in-asteptare": "⏳ În așteptare",
  emisa: "✅ Emisă",
  eroare: "⚠️ Eroare",
  stornata: "↩️ Stornată",
};
const SPV: Record<string, string> = {
  netrimisa: "netrimisă",
  "in-prelucrare": "în prelucrare",
  trimisa: "✅ trimisă",
  eroare: "⚠️ respinsă",
};

function lunaAnterioara(luna: string) {
  const [a, l] = luna.split("-").map(Number);
  const d = new Date(Date.UTC(a, l - 2, 1));
  return d.toISOString().slice(0, 7);
}

export default async function FacturiPage({ searchParams }: { searchParams: Promise<{ luna?: string }> }) {
  const u = await cerePanou();
  const cerut = (await searchParams).luna ?? "";
  const luna = /^\d{4}-\d{2}$/.test(cerut) ? cerut : lunaCurenta();
  const facturi = await listaFacturi(luna);
  const emise = facturi.filter((f) => f.seria);
  const total = emise.reduce((s, f) => s + f.totalBani, 0);
  const cota = cotaTva();

  return (
    <>
      <h1>Facturi</h1>
      <p className="muted">
        Emitent: Hugetech SRL · {cota ? `plătitor de TVA, cota ${cota}%` : "neplătitor de TVA"} · Program de facturare:{" "}
        {oblioConfigurat() ? "Oblio, conectat" : "neconectat (facturile rămân în așteptare)"}
        {" "}· <Link href="/admin/statistici">Statistici</Link> · <Link href="/admin/invitatii">Invitații agenții</Link>
      </p>
      <p>
        <Link href={`?luna=${lunaAnterioara(luna)}`}>← luna anterioară</Link> · <strong>{luna}</strong> ·{" "}
        {emise.length} facturi, total {lei(total)} ·{" "}
        <a href={`/admin/facturi/export?luna=${luna}`}>Descarcă pentru contabil (Excel/CSV)</a>
      </p>
      <table className="tabel">
        <thead>
          <tr><th>Data</th><th>Factura</th><th>Cumpărător</th><th>Total</th><th>Stare</th><th>e-Factura</th><th></th></tr>
        </thead>
        <tbody>
          {facturi.map((f) => {
            const c = f.cumparator as Cumparator;
            return (
              <tr key={f.id}>
                <td>{zi(f.emisaLa ?? f.creatLa)}</td>
                <td>
                  {f.seria ? (f.linkPdf ? <a href={f.linkPdf} target="_blank" rel="noreferrer">{f.seria} {f.numar}</a> : `${f.seria} ${f.numar}`) : "—"}
                  {f.tip === "storno" && " (storno)"}
                </td>
                <td>{c.nume}{c.cui ? ` · CUI ${c.cui}` : ""}</td>
                <td>{lei(f.totalBani)}</td>
                <td title={f.eroare ?? undefined}>{STARE[f.stare] ?? f.stare}{f.eroare && <div className="muted">{f.eroare}</div>}</td>
                <td>{f.eFactura ? SPV[f.eFactura] ?? f.eFactura : "—"}</td>
                <td>
                  {f.tip === "factura" && (f.stare === "in-asteptare" || f.stare === "eroare") && (
                    <form action={reemite}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" title="Verifică întâi în Oblio că factura nu s-a emis deja.">Emite din nou</button>
                    </form>
                  )}
                  {f.seria && f.eFactura !== "trimisa" && (
                    <form action={eFactura}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit">Trimite / verifică SPV</button>
                    </form>
                  )}
                  {f.tip === "factura" && f.stare === "emisa" && (
                    <form action={storneaza}>
                      <input type="hidden" name="id" value={f.id} />
                      <label className="muted"><input type="checkbox" name="confirm" value="da" required /> sigur</label>{" "}
                      <button type="submit">Stornează</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!facturi.length && <p className="muted">Nicio factură în luna aceasta.</p>}
    </>
  );
}
