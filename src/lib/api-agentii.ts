import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";

// Cheia API a agenției: programul agenției (CRM) își trimite singur anunțurile, fără fișier.
// Păstrăm doar hash-ul; cheia întreagă o vede agenția o singură dată, când o generează.

const PREFIX = "cm_";
const hash = (cheie: string) => createHash("sha256").update(cheie).digest("hex");

/** Generează o cheie nouă (cea veche nu mai merge) și o întoarce o singură dată. */
export async function genereazaCheieApi(utilizatorId: string) {
  const cheie = PREFIX + randomBytes(24).toString("base64url");
  await db.utilizator.update({ where: { id: utilizatorId }, data: { apiCheieHash: hash(cheie) } });
  return cheie;
}

export async function anuleazaCheieApi(utilizatorId: string) {
  await db.utilizator.update({ where: { id: utilizatorId }, data: { apiCheieHash: null } });
}

export async function areCheieApi(utilizatorId: string) {
  const u = await db.utilizator.findUnique({ where: { id: utilizatorId }, select: { apiCheieHash: true } });
  return !!u?.apiCheieHash;
}

/** Agenția căreia îi aparține cheia din antetul „Authorization: Bearer …”, sau null. */
export async function agentieDinCerere(req: Request) {
  const cheie = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!cheie.startsWith(PREFIX) || cheie.length > 100) return null;
  const u = await db.utilizator.findUnique({ where: { apiCheieHash: hash(cheie) } });
  if (!u || u.tip !== "agentie" || u.stersLa || !u.emailConfirmatLa) return null;
  return u;
}
