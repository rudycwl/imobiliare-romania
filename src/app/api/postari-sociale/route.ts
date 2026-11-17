import { NextResponse } from "next/server";
import { cerereDeLaServer } from "@/lib/alerte";
import { db } from "@/lib/db";
import { citesteCerere, inregistreazaPostare } from "@/lib/postari-sociale";

export const dynamic = "force-dynamic";

// Postările CheiaMea pe rețele (Instagram, Facebook …): înregistrarea anunță automat proprietarul anunțului pe e-mail.
//   POST /api/postari-sociale   { "anuntId": 5, "retea": "instagram", "url": "https://www.instagram.com/p/…/" }
// Acces: antetul x-cheie (aceeași cheie ca timerele de pe server, /etc/cheiamea/cheie-alerte sau ALERTE_CHEIE),
// sau administratorul logat, cu panoul /admin deschis. Altfel 401.

/** Cererea vine de la server (x-cheie) sau de la administrator cu panoul deschis? */
async function autorizat(req: Request) {
  if (cerereDeLaServer(req)) return true;
  try {
    // Încărcat doar aici: panoul folosește cookie-urile cererii Next. Orice eroare = neautorizat.
    const { adminPanou } = await import("@/lib/panou");
    return !!(await adminPanou());
  } catch {
    return false;
  }
}

const neautorizat = () => NextResponse.json({ eroare: "neautorizat" }, { status: 401 });

export async function POST(req: Request) {
  if (!(await autorizat(req))) return neautorizat();
  const c = citesteCerere(await req.json().catch(() => null));
  if ("eroare" in c) return NextResponse.json({ eroare: c.eroare }, { status: 400 });
  const r = await inregistreazaPostare(c);
  if ("eroare" in r) return NextResponse.json({ eroare: r.eroare }, { status: r.status });
  return NextResponse.json(
    {
      postare: { id: r.postare.id, anuntId: r.postare.anuntId, retea: r.postare.retea, url: r.postare.url, creatLa: r.postare.creatLa.toISOString() },
      nou: r.nou,
      email: r.email,
      ...(r.motiv ? { motiv: r.motiv } : {}),
    },
    { status: r.nou ? 201 : 200 },
  );
}

/** GET /api/postari-sociale?anuntId=5 – postările înregistrate pentru un anunț (aceeași autorizare). */
export async function GET(req: Request) {
  if (!(await autorizat(req))) return neautorizat();
  const anuntId = Number(new URL(req.url).searchParams.get("anuntId"));
  if (!Number.isInteger(anuntId) || anuntId <= 0) return NextResponse.json({ eroare: "anuntId lipsește" }, { status: 400 });
  const postari = await db.postareSociala.findMany({ where: { anuntId }, orderBy: { creatLa: "asc" } });
  return NextResponse.json({ postari });
}
