import { NextResponse } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";

const privat = { "Cache-Control": "private, no-store" };

/** Id-urile anunțurilor favorite; paginile cu anunțuri sunt cache-uite, deci inimile se colorează din browser. */
export async function GET() {
  const u = await utilizatorCurent();
  if (!u) return NextResponse.json({ autentificat: false, ids: [] }, { headers: privat });
  const f = await db.favorit.findMany({ where: { utilizatorId: u.id }, select: { anuntId: true } });
  return NextResponse.json({ autentificat: true, ids: f.map((x) => x.anuntId) }, { headers: privat });
}

/** Pune sau scoate un anunț din favorite: { id, pus }. */
export async function POST(req: Request) {
  const u = await utilizatorCurent();
  if (!u) return NextResponse.json({ eroare: "autentificare" }, { status: 401, headers: privat });
  const { id, pus } = (await req.json().catch(() => ({}))) as { id?: unknown; pus?: unknown };
  const anuntId = Number(id);
  if (!Number.isInteger(anuntId) || anuntId < 1) return NextResponse.json({ eroare: "id" }, { status: 400, headers: privat });
  const cheie = { utilizatorId_anuntId: { utilizatorId: u.id, anuntId } };
  if (pus) {
    if (!(await db.anunt.count({ where: { id: anuntId } }))) return NextResponse.json({ eroare: "id" }, { status: 404, headers: privat });
    await db.favorit.upsert({ where: cheie, create: { utilizatorId: u.id, anuntId }, update: {} });
  } else {
    await db.favorit.deleteMany({ where: { utilizatorId: u.id, anuntId } });
  }
  return NextResponse.json({ pus: !!pus }, { headers: privat });
}
