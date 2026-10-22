import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";

export const COOKIE_SURSA = "cm_sursa";
export const COOKIE_REF = "cm_ref";
export const DURATA_COOKIE = 60 * 60 * 24 * 30; // 30 de zile

const curata = (v: string | null | undefined, max = 60) => (v ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, max) || undefined;

/** Sursa unei vizite: utm_source, apoi recomandare, apoi site-ul de proveniență, altfel „direct”. */
export function determinaSursa(search: string, referrer: string, hostPropriu: string) {
  const p = new URLSearchParams(search);
  const ref = curata(p.get("ref"));
  let sursa = curata(p.get("utm_source"));
  if (!sursa && ref) sursa = "recomandare";
  if (!sursa && referrer) {
    try {
      const h = new URL(referrer).hostname.replace(/^www\.|^m\.|^l\./, "");
      if (h && !h.endsWith(hostPropriu.replace(/^www\./, ""))) sursa = curata(h);
    } catch {
      /* referrer invalid */
    }
  }
  return { sursa: sursa ?? "direct", mediu: curata(p.get("utm_medium")), campanie: curata(p.get("utm_campaign"), 80), ref };
}

/** Sursa și recomandarea salvate în cookie la prima vizită (pentru înscriere). */
export async function atribuireCurenta() {
  const c = await cookies();
  return { sursa: curata(c.get(COOKIE_SURSA)?.value), ref: curata(c.get(COOKIE_REF)?.value) };
}

/**
 * Aplică recomandarea după înscriere: salvează cine a recomandat și dă recompensele:
 * la fiecare 3 conturi aduse, 7 zile de promovare; agenție adusă de agenție: +1 lună gratuită (maximum 6).
 */
export async function aplicaRecomandare(utilizatorId: string, tip: string) {
  const { sursa, ref } = await atribuireCurenta();
  const recomandator = ref ? await db.utilizator.findUnique({ where: { slug: ref } }) : null;
  const valid = recomandator && recomandator.id !== utilizatorId ? recomandator : null;
  await db.utilizator.update({ where: { id: utilizatorId }, data: { sursa: sursa ?? null, recomandatDeId: valid?.id ?? null } });
  if (!valid) return;

  const total = await db.utilizator.count({ where: { recomandatDeId: valid.id } });
  const data: { zilePromovare?: { increment: number }; luniBonus?: { increment: number }; gratuitPanaLa?: Date } = {};
  if (total % 3 === 0) data.zilePromovare = { increment: 7 };
  if (tip === "agentie" && valid.tip === "agentie" && valid.luniBonus < 6) {
    const baza = valid.gratuitPanaLa && valid.gratuitPanaLa > new Date() ? new Date(valid.gratuitPanaLa) : new Date();
    baza.setMonth(baza.getMonth() + 1);
    data.luniBonus = { increment: 1 };
    data.gratuitPanaLa = baza;
  }
  if (Object.keys(data).length) await db.utilizator.update({ where: { id: valid.id }, data });
}
