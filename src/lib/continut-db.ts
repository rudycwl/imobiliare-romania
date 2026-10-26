import "server-only";
import { db } from "./db";
import { ACTUALIZAT, STIRI, STIRI_PIATA } from "./continut";
import { caleImpozite, ORASE_IMPOZITE } from "./impozite-locale";

// Știrile și impozitele locale vin din cod (continut.ts, impozite-locale.ts), unde le adaugă motorul automat
// după verificarea în sursa oficială. Din panou (/admin/continut) administratorul poate ascunde orice element;
// lista celor ascunse e în baza de date, deci rămâne valabilă și după ce motorul adaugă altele.

const CHEIE = "ascunse";

/** Cheia unui element: linkul sursei la știri, adresa paginii la orașe. */
// Știrile de piață au `sursa` text și linkul în `url`; noutățile legislative au linkul în `sursa.url`.
export const cheieStire = (s: { sursa: { url: string } } | { sursa: string; url: string }) => (typeof s.sursa === "string" ? (s as { url: string }).url : s.sursa.url);
export { caleImpozite as cheieOras };

export async function citesteAscunse(): Promise<string[]> {
  try {
    const r = await db.setare.findUnique({ where: { cheie: CHEIE } });
    return r ? (JSON.parse(r.valoare) as string[]) : [];
  } catch {
    return [];
  }
}

export async function schimbaAscuns(cheie: string, ascuns: boolean) {
  const lista = new Set(await citesteAscunse());
  if (ascuns) lista.add(cheie);
  else lista.delete(cheie);
  const valoare = JSON.stringify([...lista]);
  await db.setare.upsert({ where: { cheie: CHEIE }, create: { cheie: CHEIE, valoare }, update: { valoare } });
}

export async function citesteStiri() {
  const a = new Set(await citesteAscunse());
  return STIRI.filter((s) => !a.has(cheieStire(s)));
}
export async function citesteStiriPiata() {
  const a = new Set(await citesteAscunse());
  return STIRI_PIATA.filter((s) => !a.has(cheieStire(s)));
}
export const citesteActualizat = async () => ACTUALIZAT;
export async function citesteImpozite() {
  const a = new Set(await citesteAscunse());
  return ORASE_IMPOZITE.filter((o) => !a.has(caleImpozite(o)));
}

export async function gasesteImpozite(cale: string) {
  return (await citesteImpozite()).find((o) => caleImpozite(o) === cale);
}

/** Datele pentru o pagină de oraș; în București aceeași hotărâre acoperă toate sectoarele. */
export async function impoziteOrasDb(judet: string, oras: string) {
  return (await citesteImpozite()).find((o) => o.judet === judet && (!o.oras || o.oras === oras));
}
