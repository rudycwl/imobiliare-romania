import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { activ } from "@/lib/anunturi";
import { agentieDinCerere } from "@/lib/api-agentii";
import { publicaPrinApi } from "@/lib/api-cod";
import { db } from "@/lib/db";
import { adresaSite } from "@/lib/email";
import { completeazaCoordonate } from "@/lib/geocodare";
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
      select: { id: true, titlu: true, pret: true, tranzactie: true, expiraLa: true, externId: true },
    }),
    db.anunt.findMany({ where: { proprietarId: u.id, ...activ() }, select: { id: true } }),
  ]);
  const publice = new Set(active.map((a) => a.id));
  return NextResponse.json({
    anunturi: anunturi.map((a) => ({
      id: a.id,
      cod: a.externId,
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

  // Cu „cod” (codul anunțului în programul agenției): același cod actualizează / reactivează anunțul, nu-l dublează.
  const rez = await publicaPrinApi(u.id, lista);
  const schimbate = rez.publicate.length + rez.actualizate.length;
  if (schimbate) {
    after(() => completeazaCoordonate(Math.min(schimbate, 200)));
    revalidatePath("/");
    revalidatePath(`/agentii/${u.slug}`);
    for (const a of rez.actualizate) revalidatePath(`/anunt/${a.id}`);
  }
  const link = (id: number) => `${adresaSite()}/anunt/${id}`;
  return NextResponse.json(
    {
      publicate: rez.publicate.map((p) => ({ pozitie: p.rand, id: p.id, ...(p.cod ? { cod: p.cod } : {}), link: link(p.id) })),
      actualizate: rez.actualizate.map((p) => ({ pozitie: p.rand, id: p.id, cod: p.cod, reactivat: p.reactivat, link: link(p.id) })),
      cuPoze: rez.cuPoze,
      sarite: rez.sarite.map((s) => ({ pozitie: s.rand, motiv: s.motiv })),
      ...(rez.oprit ? { oprit: rez.oprit } : {}),
    },
    { status: rez.publicate.length ? 201 : 200 },
  );
}
