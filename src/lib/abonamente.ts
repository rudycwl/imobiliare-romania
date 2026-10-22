import "server-only";
import { db } from "./db";
import { ANUNTURI_GRATUITE, getAbonament, type Abonament } from "./tarife";

type ContAgentie = { tip: string; gratuitPanaLa: Date | null; abonament: string | null; abonamentPanaLa: Date | null };

/** Perioada gratuită (Fondatoare, luni bonus) are toate funcțiile, deci nivelul Nelimitat. */
const NIVEL_GRATUIT = "nelimitat";

/** Abonamentul activ al unei agenții, sau null. */
export function abonamentActiv(u: ContAgentie, acum = new Date()): Abonament | null {
  if (u.tip !== "agentie") return null;
  if (u.abonamentPanaLa && u.abonamentPanaLa > acum) return getAbonament(u.abonament);
  if (u.gratuitPanaLa && u.gratuitPanaLa > acum) return getAbonament(NIVEL_GRATUIT);
  return null;
}

/** Câte anunțuri active poate avea un cont; null = nelimitat. Fără abonament, o agenție are limita gratuită. */
export function limitaPentru(u: ContAgentie) {
  const a = abonamentActiv(u);
  return a ? a.anunturi : ANUNTURI_GRATUITE;
}

const ZI = 864e5;

/** Activează sau prelungește abonamentul după o plată: 30 de zile sau 12 luni. Creditele se reîncarcă imediat. */
export async function activeazaAbonament(utilizatorId: string, cod: string, anual: boolean) {
  const a = getAbonament(cod);
  if (!a) throw new Error(`Abonament necunoscut: ${cod}`);
  const u = await db.utilizator.findUniqueOrThrow({ where: { id: utilizatorId } });
  const acum = new Date();
  // La reînnoirea aceluiași abonament, perioada se adaugă la cea rămasă; la schimbarea abonamentului începe de azi.
  const start = u.abonament === cod && u.abonamentPanaLa && u.abonamentPanaLa > acum ? u.abonamentPanaLa : acum;
  await db.utilizator.update({
    where: { id: utilizatorId },
    data: {
      abonament: cod,
      plataAnuala: anual,
      abonamentPanaLa: new Date(start.getTime() + (anual ? 365 : 30) * ZI),
      creditReactualizari: a.credite.reactualizari,
      creditTop: a.credite.top7,
      crediteReincarcareLa: new Date(acum.getTime() + 30 * ZI),
    },
  });
}

/** Reîncarcă creditele lunare dacă a trecut luna; întoarce creditele curente. */
export async function credite(utilizatorId: string) {
  const u = await db.utilizator.findUniqueOrThrow({ where: { id: utilizatorId } });
  const a = abonamentActiv(u);
  const acum = new Date();
  if (a && (!u.crediteReincarcareLa || u.crediteReincarcareLa <= acum)) {
    const r = await db.utilizator.update({
      where: { id: utilizatorId },
      data: { creditReactualizari: a.credite.reactualizari, creditTop: a.credite.top7, crediteReincarcareLa: new Date(acum.getTime() + 30 * ZI) },
    });
    return { reactualizari: r.creditReactualizari, top: r.creditTop, abonament: a };
  }
  return { reactualizari: a ? u.creditReactualizari : 0, top: a ? u.creditTop : 0, abonament: a };
}
