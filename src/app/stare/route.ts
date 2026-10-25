import { readdir } from "fs/promises";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ultimaCuratare } from "@/lib/curatare-teste";

export const dynamic = "force-dynamic";

// Starea publică a site-ului, doar numere (fără date despre clienți), ca să poată fi verificată de la distanță.
export async function GET() {
  const [plati, platiFacturate, facturiNeemise, eFactura] = await Promise.all([
    db.comanda.count(),
    db.factura.count({ where: { plataRef: { not: null }, OR: [{ seria: { not: null } }, { stare: { in: ["emisa", "stornata"] } }] } }),
    db.factura.count({ where: { seria: null } }),
    db.factura.groupBy({ by: ["tip", "stare", "eFactura"], where: { seria: { not: null } }, _count: true }),
  ]);
  const dir = process.env.COPII_DIR;
  const copii = dir ? (await readdir(dir).catch(() => [] as string[])).filter((x) => /^baza-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(x)).sort() : [];
  return NextResponse.json(
    {
      generat: new Date().toISOString(),
      plati,
      platiFacturate,
      facturiNeemise,
      // Facturile emise, numărate pe tip / stare / e-Factura (ex. „factura stornata trimisa”: 1).
      facturiEmise: Object.fromEntries(eFactura.map((r) => [`${r.tip} ${r.stare} ${r.eFactura ?? "-"}`, r._count])),
      curatarePlatiTest: ultimaCuratare(),
      ultimaCopieBaza: copii.at(-1)?.slice(5, 15) ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
