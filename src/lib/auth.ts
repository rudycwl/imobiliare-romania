import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { laUtilizator } from "./utilizatori";

const COOKIE = "sesiune";
const DURATA_MS = 30 * 24 * 60 * 60 * 1000;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function deschideSesiune(utilizatorId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiraLa = new Date(Date.now() + DURATA_MS);
  await db.sesiune.create({ data: { id: hash(token), utilizatorId, expiraLa } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraLa,
  });
}

export async function inchideSesiune() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.sesiune.deleteMany({ where: { id: hash(token) } });
  jar.delete(COOKIE);
}

/** Utilizatorul autentificat, cu email, sau null. */
export async function utilizatorCurent() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.sesiune.findUnique({ where: { id: hash(token) }, include: { utilizator: true } });
  if (!s || s.expiraLa < new Date()) return null;
  return { ...laUtilizator(s.utilizator), email: s.utilizator.email, gratuitPanaLa: s.utilizator.gratuitPanaLa };
}
