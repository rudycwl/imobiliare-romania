import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { localitate, platforma } from "@/lib/vizitator";
import { ipClient, noteaza, permis } from "@/lib/limita";
import { COOKIE_REF, COOKIE_SURSA, determinaSursa, DURATA_COOKIE } from "@/lib/atribuire";

/**
 * Înregistrează o vizită nouă (o dată pe sesiune, fără date personale). Cookie-urile cu sursa primei vizite și recomandarea
 * se pun doar cu acordul din bannerul de cookie-uri (cm_cookie=da); `doarCookie` le pune după acord fără să numere din nou vizita,
 * iar `stergeCookie` le șterge la „Doar necesare”.
 */
export async function POST(req: NextRequest) {
  // Fără conturi, deci limităm pe adresă: un robot nu poate umple baza de date cu vizite.
  const ip = await ipClient();
  if (!permis(`vizita:${ip}`, 60, 60 * 60_000)) return new NextResponse(null, { status: 429 });
  noteaza(`vizita:${ip}`);
  let corp: { search?: string; referrer?: string; pagina?: string; doarCookie?: boolean; stergeCookie?: boolean } = {};
  try {
    corp = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const r = new NextResponse(null, { status: 204 });
  if (corp.stergeCookie) {
    r.cookies.delete(COOKIE_SURSA);
    r.cookies.delete(COOKIE_REF);
    return r;
  }
  const s = determinaSursa(String(corp.search ?? "").slice(0, 500), String(corp.referrer ?? "").slice(0, 500), req.nextUrl.hostname);
  // Vizitele administratorului (logat pe site) nu se numără: ar umfla cifrele din panou.
  if (!corp.doarCookie && !esteAdmin((await utilizatorCurent())?.email))
    await db.vizita.create({
      data: {
        sursa: s.sursa,
        mediu: s.mediu,
        campanie: s.campanie,
        pagina: String(corp.pagina ?? "").slice(0, 200) || null,
        ...platforma(req.headers.get("user-agent") ?? ""),
        ...(await localitate(ip)),
      },
    });

  if (req.cookies.get("cm_cookie")?.value !== "da") return r;
  const optiuni = { maxAge: DURATA_COOKIE, httpOnly: true, sameSite: "lax" as const, secure: req.nextUrl.protocol === "https:", path: "/" };
  // Prima atingere contează: nu suprascriem sursa sau recomandarea deja salvate.
  if (!req.cookies.has(COOKIE_SURSA)) r.cookies.set(COOKIE_SURSA, s.sursa, optiuni);
  if (s.ref && !req.cookies.has(COOKIE_REF)) r.cookies.set(COOKIE_REF, s.ref, optiuni);
  return r;
}
