import { NextResponse, type NextRequest } from "next/server";
import { cheieBuna } from "@/lib/cheie-erp";
import { descarcaPaginaAgentie } from "@/lib/pagina-agentie";
import { anuntDinPagina, esteLinkAnuntAgentie, valoriFormular } from "@/lib/import-site-softimobiliar";

export const dynamic = "force-dynamic";

// Diagnostic (doar citire, nu salvează nimic): rulează de pe serverul site-ului importul unui anunț de pe site-ul unei agenții,
// exact ca „Adaugă anunț” → link, și întoarce ce iese. GET ?link=…  cu antetul X-ERP-Key.
export async function GET(req: NextRequest) {
  if (!cheieBuna(req.headers.get("x-erp-key")?.trim() ?? null)) return new NextResponse(null, { status: 403 });
  const link = req.nextUrl.searchParams.get("link") ?? "";
  const rez: Record<string, unknown> = { link, esteLinkAgentie: esteLinkAnuntAgentie(link) };
  const t0 = Date.now();
  try {
    const p = await descarcaPaginaAgentie(link);
    rez.descarcare = p.stare;
    rez.ms = Date.now() - t0;
    if (p.stare === "ok") {
      rez.final = p.final.toString();
      rez.html = p.html.length;
      const r = anuntDinPagina(p.html, p.final.toString(), { cursEuro: null, judet: "iasi", oras: "iasi" });
      if ("eroare" in r) rez.eroare = r.eroare;
      else {
        const v = valoriFormular(r.rand);
        rez.valori = { titlu: v.titlu, pret: v.pret, tip: v.tip, judet: v.judet, oras: v.oras, poze: (r.rand.poze ?? "").split(/\s+/).filter(Boolean).length };
      }
    }
  } catch (e) {
    rez.exceptie = { nume: (e as Error)?.name, mesaj: String((e as Error)?.message ?? e).slice(0, 300) };
    rez.ms = Date.now() - t0;
  }
  return NextResponse.json(rez, { headers: { "cache-control": "no-store" } });
}
