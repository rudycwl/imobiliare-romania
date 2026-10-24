import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ipClient, noteaza, permis } from "@/lib/limita";
import { COOKIE_REF, COOKIE_SURSA, determinaSursa, DURATA_COOKIE } from "@/lib/atribuire";

/** Înregistrează o vizită nouă (o dată pe sesiune) și reține sursa primei vizite, pentru statistici. */
export async function POST(req: NextRequest) {
  // Fără conturi, deci limităm pe adresă: un robot nu poate umple baza de date cu vizite.
  const ip = await ipClient();
  if (!permis(`vizita:${ip}`, 60, 60 * 60_000)) return new NextResponse(null, { status: 429 });
  noteaza(`vizita:${ip}`);
  let corp: { search?: string; referrer?: string; pagina?: string } = {};
  try {
    corp = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const s = determinaSursa(String(corp.search ?? "").slice(0, 500), String(corp.referrer ?? "").slice(0, 500), req.nextUrl.hostname);
  await db.vizita.create({ data: { sursa: s.sursa, mediu: s.mediu, campanie: s.campanie, pagina: String(corp.pagina ?? "").slice(0, 200) || null } });

  const r = new NextResponse(null, { status: 204 });
  const optiuni = { maxAge: DURATA_COOKIE, httpOnly: true, sameSite: "lax" as const, secure: req.nextUrl.protocol === "https:", path: "/" };
  // Prima atingere contează: nu suprascriem sursa sau recomandarea deja salvate.
  if (!req.cookies.has(COOKIE_SURSA)) r.cookies.set(COOKIE_SURSA, s.sursa, optiuni);
  if (s.ref && !req.cookies.has(COOKIE_REF)) r.cookies.set(COOKIE_REF, s.ref, optiuni);
  return r;
}
