import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { activ } from "@/lib/anunturi";
import { agentieDinCerere } from "@/lib/api-agentii";
import { randDinJson } from "@/lib/api-format";
import { db } from "@/lib/db";
import { adresaSite } from "@/lib/email";
import { completeazaCoordonate } from "@/lib/geocodare";
import { importaRanduri } from "@/lib/import-masa";
import { noteaza, permis } from "@/lib/limita";

// API pentru agenții: programul agenției publică anunțuri (POST) și vede ce are pe site (GET).
// Documentația pentru programatori: /pentru-agentii/api.

const MAX_PE_CERERE = 100;
const MAX_CERERI_PE_ORA = 60;

const eroare = (status: number, mesaj: string) => NextResponse.json({ eroare: mesaj }, { status });
const FARA_CHEIE = "Cheie API lipsă sau greșită. O generezi din contul agenției, pagina „Import anunțuri”.";

export async function GET(req: Request) {
  const u = await agentieDinCerere(req);
  if (!u) return eroare(401, FARA_CHEIE);
  const [anunturi, active] = await Promise.all([
    db.anunt.findMany({
      where: { proprietarId: u.id },
      orderBy: { id: "desc" },
      take: 1000,
      select: { id: true, titlu: true, pret: true, tranzactie: true, expiraLa: true },
    }),
    db.anunt.findMany({ where: { proprietarId: u.id, ...activ() }, select: { id: true } }),
  ]);
  const publice = new Set(active.map((a) => a.id));
  return NextResponse.json({
    anunturi: anunturi.map((a) => ({
      id: a.id,
      titlu: a.titlu,
      pret: a.pret,
      tranzactie: a.tranzactie,
      public: publice.has(a.id),
      expiraLa: a.expiraLa.toISOString(),
      link: `${adresaSite()}/anunt/${a.id}`,
    })),
  });
}

export async function POST(req: Request) {
  const u = await agentieDinCerere(req);
  if (!u) return eroare(401, FARA_CHEIE);
  const cheieLimita = `api|${u.id}`;
  if (!permis(cheieLimita, MAX_CERERI_PE_ORA, 3600_000)) return eroare(429, `Maximum ${MAX_CERERI_PE_ORA} cereri pe oră. Încearcă din nou mai târziu.`);
  noteaza(cheieLimita);

  const corp = await req.json().catch(() => null);
  const lista: unknown = Array.isArray(corp) ? corp : corp?.anunturi;
  if (!Array.isArray(lista)) return eroare(400, "Corpul cererii trebuie să fie JSON: { \"anunturi\": [ … ] }.");
  if (!lista.length) return eroare(400, "Lista de anunțuri e goală.");
  if (lista.length > MAX_PE_CERERE) return eroare(400, `Maximum ${MAX_PE_CERERE} anunțuri pe cerere. Trimite-le în mai multe cereri.`);

  const rez = await importaRanduri(u.id, lista.map(randDinJson), 1);
  if (rez.importate) {
    after(() => completeazaCoordonate(Math.min(rez.importate, 200)));
    revalidatePath("/");
    revalidatePath(`/agentii/${u.slug}`);
  }
  return NextResponse.json(
    {
      publicate: (rez.publicate ?? []).map((p) => ({ pozitie: p.rand, id: p.id, link: `${adresaSite()}/anunt/${p.id}` })),
      cuPoze: rez.cuPoze,
      sarite: rez.sarite.map((s) => ({ pozitie: s.rand, motiv: s.motiv })),
      ...(rez.oprit ? { oprit: rez.oprit } : {}),
    },
    { status: rez.importate ? 201 : 200 },
  );
}
