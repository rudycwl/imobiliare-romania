import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { adresaSite, trimiteEmail, type Email } from "./email";

// Postările CheiaMea pe rețelele sociale. Rudy 17.11.2026: „când postez un anunț pe rețele, clientul trebuie anunțat
// automat” și „fiecare client are dreptul să știe, să vadă”. Postarea se înregistrează prin POST /api/postari-sociale
// (doar serverul, cu cheia din /etc/cheiamea/cheie-alerte, sau administratorul cu panoul deschis); proprietarul anunțului
// primește un e-mail o singură dată pe postare și vede postarea în „Anunțurile mele”.

export const RETELE = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
} as const;
export type Retea = keyof typeof RETELE;

/** Domeniile acceptate pentru fiecare rețea (linkul trebuie să fie chiar al rețelei, nu oricare). */
const DOMENII: Record<Retea, string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com", "fb.watch"],
  tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be"],
  linkedin: ["linkedin.com"],
  x: ["x.com", "twitter.com"],
};

/** Parametrii de urmărire adăugați la „Copiază linkul”: nu schimbă postarea, deci nu fac din ea una nouă. */
const URMARIRE = /^(utm_.*|igsh|igshid|fbclid|mibextid|si|s|t|ref|__cft__.*|__tn__)$/i;

export const numeRetea = (r: string) => RETELE[r as Retea] ?? r;

/** Linkul postării, curățat (fără #, fără parametri de urmărire, fără „/” la final), sau null dacă nu e al rețelei. */
export function normalizeazaUrl(retea: Retea, raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");
  if (!DOMENII[retea].some((d) => host === d || host.endsWith("." + d))) return null;
  for (const k of [...u.searchParams.keys()]) if (URMARIRE.test(k)) u.searchParams.delete(k);
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  const cale = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : u.pathname;
  if (cale === "/" || !cale) return null; // doar pagina rețelei, nu o postare
  const q = u.searchParams.toString();
  return `https://${u.hostname}${cale}${q ? "?" + q : ""}`;
}

export type CererePostare = { anuntId: number; retea: Retea; url: string };

/** Verifică corpul cererii: { anuntId, retea, url }. */
export function citesteCerere(corp: unknown): CererePostare | { eroare: string } {
  if (!corp || typeof corp !== "object" || Array.isArray(corp)) return { eroare: "Corpul cererii trebuie să fie JSON: { \"anuntId\", \"retea\", \"url\" }." };
  const o = corp as Record<string, unknown>;
  const anuntId = typeof o.anuntId === "string" ? Number(o.anuntId) : o.anuntId;
  if (typeof anuntId !== "number" || !Number.isInteger(anuntId) || anuntId <= 0) return { eroare: "„anuntId” trebuie să fie numărul anunțului (ex. 5)." };
  const retea = String(o.retea ?? "").trim().toLowerCase();
  if (!(retea in RETELE)) return { eroare: `„retea” trebuie să fie una dintre: ${Object.keys(RETELE).join(", ")}.` };
  if (typeof o.url !== "string" || o.url.length > 500) return { eroare: "„url” lipsește sau e prea lung." };
  const url = normalizeazaUrl(retea as Retea, o.url);
  if (!url) return { eroare: `„url” trebuie să fie linkul https al postării pe ${numeRetea(retea)}.` };
  return { anuntId, retea: retea as Retea, url };
}

/** E-mailul către proprietar: text simplu, cu „dumneavoastră”; semnătura „Echipa CheiaMea” o adaugă șablonul (src/lib/email.ts). */
export function emailPostare(a: { id: number; titlu: string }, retea: string, url: string): Omit<Email, "catre"> {
  const nume = numeRetea(retea);
  return {
    subiect: `Anunțul dumneavoastră a fost promovat pe ${nume}`,
    paragrafe: [
      "Bună ziua,",
      `Am promovat anunțul dumneavoastră „${a.titlu}” pe ${nume}: ${url}. Anunțul complet: ${adresaSite()}/anunt/${a.id}`,
      "Postarea apare și în contul dumneavoastră, la „Anunțurile mele”. Vă mulțumim că ați ales CheiaMea!",
    ],
  };
}

export type RezultatPostare =
  | { eroare: string; status: 404 }
  | {
      nou: boolean;
      postare: { id: number; anuntId: number; retea: string; url: string; creatLa: Date; emailTrimisLa: Date | null };
      /** trimis = acum; deja-trimis = la o înregistrare anterioară; netrimis = vezi motiv (se reîncearcă la reînregistrare). */
      email: "trimis" | "deja-trimis" | "netrimis";
      motiv?: string;
    };

/**
 * Înregistrează postarea și anunță proprietarul. Același url pe același anunț nu se dublează și nu primește al doilea
 * e-mail; dacă e-mailul nu a plecat data trecută (Brevo indisponibil), reînregistrarea îl mai încearcă o dată.
 */
export async function inregistreazaPostare(c: CererePostare, trimite: (e: Email) => Promise<boolean> = trimiteEmail): Promise<RezultatPostare> {
  const anunt = await db.anunt.findUnique({
    where: { id: c.anuntId },
    select: { id: true, titlu: true, proprietar: { select: { email: true, stersLa: true } } },
  });
  if (!anunt) return { eroare: `Anunțul #${c.anuntId} nu există.`, status: 404 };

  let nou = true;
  let postare;
  try {
    postare = await db.postareSociala.create({ data: { anuntId: c.anuntId, retea: c.retea, url: c.url } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    nou = false;
    postare = await db.postareSociala.findUniqueOrThrow({ where: { anuntId_url: { anuntId: c.anuntId, url: c.url } } });
  }
  if (postare.emailTrimisLa) return { nou, postare, email: "deja-trimis" };

  const catre = anunt.proprietar.stersLa ? null : anunt.proprietar.email;
  if (!catre) return { nou, postare, email: "netrimis", motiv: "proprietarul nu are adresă de e-mail" };

  // Rezervăm trimiterea înainte de a trimite: două cereri simultane nu pot trimite amândouă.
  const acum = new Date();
  const rezervat = await db.postareSociala.updateMany({ where: { id: postare.id, emailTrimisLa: null }, data: { emailTrimisLa: acum } });
  if (!rezervat.count) return { nou, postare: await db.postareSociala.findUniqueOrThrow({ where: { id: postare.id } }), email: "deja-trimis" };

  const ok = await trimite({ catre, ...emailPostare(anunt, postare.retea, postare.url) }).catch(() => false);
  if (!ok) {
    await db.postareSociala.update({ where: { id: postare.id }, data: { emailTrimisLa: null } });
    return { nou, postare: { ...postare, emailTrimisLa: null }, email: "netrimis", motiv: "serviciul de e-mail nu a răspuns; reînregistrați postarea mai târziu" };
  }
  return { nou, postare: { ...postare, emailTrimisLa: acum }, email: "trimis" };
}

/** Postările anunțurilor din „Anunțurile mele”, grupate pe anunț, cele mai vechi primele. */
export async function postariPentru(anuntIds: number[]) {
  const lista = anuntIds.length
    ? await db.postareSociala.findMany({ where: { anuntId: { in: anuntIds } }, orderBy: [{ creatLa: "asc" }, { id: "asc" }], select: { anuntId: true, retea: true, url: true, creatLa: true } })
    : [];
  const m = new Map<number, typeof lista>();
  for (const p of lista) m.set(p.anuntId, [...(m.get(p.anuntId) ?? []), p]);
  return m;
}
