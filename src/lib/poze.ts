import "server-only";
import { randomBytes } from "crypto";
import { db } from "./db";
import { prefixCheie, stergeObiect, urlPublic } from "./stocare";

export const MAX_POZE = 10;
/** Pozele se micșorează în browser (max 1600 px, WebP) înainte de încărcare, deci 2 MB ajung. */
export const MAX_MARIME = 2 * 1024 * 1024;
export const TIPURI_POZE = ["image/webp", "image/jpeg"];

export const CULOARE_FARA_POZA = "#64748b";

export function cheieNoua(anuntId: number, tip: string) {
  return `${prefixCheie()}anunturi/${anuntId}/${randomBytes(8).toString("hex")}.${tip === "image/webp" ? "webp" : "jpg"}`;
}

export function pozeAnunt(anuntId: number) {
  return db.poza.findMany({ where: { anuntId }, orderBy: [{ ordine: "asc" }, { id: "asc" }] });
}

/** Coperta (prima poză) se ține și în Anunt.imagine, ca listele să n-aibă nevoie de încă o interogare. */
async function actualizeazaCoperta(anuntId: number) {
  const prima = await db.poza.findFirst({ where: { anuntId }, orderBy: [{ ordine: "asc" }, { id: "asc" }] });
  const imagine = prima ? `url("${urlPublic(prima.cheie)}") center / cover no-repeat ${CULOARE_FARA_POZA}` : CULOARE_FARA_POZA;
  await db.anunt.update({ where: { id: anuntId }, data: { imagine } });
}

export async function adaugaPoza(anuntId: number, cheie: string) {
  const ultima = await db.poza.findFirst({ where: { anuntId }, orderBy: { ordine: "desc" } });
  await db.poza.create({ data: { anuntId, cheie, ordine: (ultima?.ordine ?? -1) + 1 } });
  await actualizeazaCoperta(anuntId);
}

export async function stergePoza(anuntId: number, pozaId: number) {
  const p = await db.poza.findFirst({ where: { id: pozaId, anuntId } });
  if (!p) return;
  await db.poza.delete({ where: { id: p.id } });
  await stergeObiect(p.cheie).catch((e) => console.error("R2", e));
  await actualizeazaCoperta(anuntId);
}

/** Face poza aleasă copertă (prima). */
export async function facePrima(anuntId: number, pozaId: number) {
  const prima = await db.poza.findFirst({ where: { anuntId }, orderBy: { ordine: "asc" } });
  await db.poza.updateMany({ where: { id: pozaId, anuntId }, data: { ordine: (prima?.ordine ?? 0) - 1 } });
  await actualizeazaCoperta(anuntId);
}
