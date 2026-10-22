import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Date pentru ERP-ul Hugetech (doar citire). ERP-ul cere la 10 minute ce s-a schimbat de la ultima sincronizare:
//   GET /api/erp?de=2026-10-01T00:00:00Z   cu antetul X-ERP-Key: <ERP_KEY din Netlify>
// Fără `de` se întorc toate datele (prima sincronizare).

const ZI = 864e5;

function cheieBuna(primita: string | null) {
  const asteptata = process.env.ERP_KEY;
  if (!asteptata || !primita) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(primita), h(asteptata));
}

export async function GET(req: NextRequest) {
  if (!cheieBuna(req.headers.get("x-erp-key"))) return new NextResponse(null, { status: 403 });
  const p = req.nextUrl.searchParams.get("de");
  const de = p && !Number.isNaN(Date.parse(p)) ? new Date(p) : new Date(0);
  const acum = new Date();

  const [comenzi, facturi, utilizatori, pePeTip, anunturiActive, anunturiVerificare, vizite30] = await Promise.all([
    db.comanda.findMany({
      where: { OR: [{ creatLa: { gte: de } }, { platitaLa: { gte: de } }] },
      orderBy: { creatLa: "asc" },
      include: { utilizator: { select: { id: true, nume: true, email: true, tip: true } } },
    }),
    db.factura.findMany({ where: { OR: [{ creatLa: { gte: de } }, { emisaLa: { gte: de } }] }, orderBy: { creatLa: "asc" } }),
    // Conturile noi, plus toate agențiile (ca abonamentul și data expirării să fie mereu la zi în ERP).
    db.utilizator.findMany({
      where: { OR: [{ creatLa: { gte: de } }, { tip: "agentie" }] },
      select: {
        id: true, tip: true, nume: true, contact: true, email: true, telefon: true, judet: true, oras: true, cui: true, creatLa: true,
        fondator: true, gratuitPanaLa: true, abonament: true, abonamentPanaLa: true, plataAnuala: true, sursa: true,
        _count: { select: { anunturi: true } },
      },
    }),
    db.utilizator.groupBy({ by: ["tip"], _count: { _all: true } }),
    db.anunt.count({ where: { moderare: "ok", expiraLa: { gt: acum } } }),
    db.anunt.count({ where: { moderare: "verificare" } }),
    db.vizita.count({ where: { creatLa: { gte: new Date(acum.getTime() - 30 * ZI) } } }),
  ]);

  return NextResponse.json({
    generat: acum.toISOString(),
    rezumat: {
      utilizatori: Object.fromEntries(pePeTip.map((r) => [r.tip, r._count._all])),
      anunturiActive,
      anunturiVerificare,
      vizite30,
    },
    comenzi: comenzi.map((c) => ({
      id: c.id, creatLa: c.creatLa, platitaLa: c.platitaLa, tip: c.tip, produs: c.produs, descriere: c.descriere, anual: c.anual,
      anuntId: c.anuntId, sumaBani: c.sumaBani, stare: c.stare, client: c.utilizator,
    })),
    facturi: facturi.map((f) => ({
      id: f.id, creatLa: f.creatLa, tip: f.tip, stare: f.stare, plataRef: f.plataRef, seria: f.seria, numar: f.numar, emisaLa: f.emisaLa,
      totalBani: f.totalBani, cotaTva: f.cotaTva, eFactura: f.eFactura, linkPdf: f.linkPdf, eroare: f.eroare, utilizatorId: f.utilizatorId,
      cumparator: f.cumparator,
    })),
    utilizatori: utilizatori.map(({ _count, ...u }) => ({ ...u, anunturi: _count.anunturi })),
  });
}
