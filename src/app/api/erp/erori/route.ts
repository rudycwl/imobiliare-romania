import { NextResponse, type NextRequest } from "next/server";
import { cheieBuna } from "@/lib/cheie-erp";
import { listaErori, MAX_ERORI } from "@/lib/raport-erori";

export const dynamic = "force-dynamic";

// Erorile site-ului pentru ERP-ul Hugetech (doar citire, nu atinge baza de date, deci răspunde și când Neon nu răspunde).
//   GET /api/erp/erori?de=2026-11-15T00:00:00Z   cu antetul X-ERP-Key: <ERP_KEY din pagina /configurare>
// Fără `de` se întorc toate erorile păstrate (cel mult MAX_ERORI), cele mai recente primele.
export async function GET(req: NextRequest) {
  if (!process.env.ERP_KEY?.trim()) return NextResponse.json({ eroare: "ERP_KEY nu e setată pe site" }, { status: 503 });
  if (!cheieBuna(req.headers.get("x-erp-key")?.trim() ?? null)) return new NextResponse(null, { status: 403 });
  const p = req.nextUrl.searchParams.get("de");
  const de = p && !Number.isNaN(Date.parse(p)) ? new Date(p) : undefined;
  const erori = listaErori(de);
  return NextResponse.json(
    { generat: new Date().toISOString(), pornit: new Date(Date.now() - process.uptime() * 1000).toISOString(), maxim: MAX_ERORI, erori },
    { headers: { "cache-control": "no-store" } },
  );
}
