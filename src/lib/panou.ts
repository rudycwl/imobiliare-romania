import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { utilizatorCurent } from "./auth";
import { esteAdmin } from "./fondatori";

// Panoul /admin cere emailul și parola la fiecare intrare, chiar dacă administratorul e deja logat pe site:
// un cookie separat, legat de sesiunea curentă, valabil 2 ore și șters la închiderea browserului.

const COOKIE = "panou";
const DURATA_MS = 2 * 60 * 60 * 1000;
const cheie = () => process.env.PANOU_SECRET || process.env.DATABASE_URL || "cheiamea";
const semnatura = (sesiune: string, exp: number) => createHmac("sha256", cheie()).update(`${sesiune}.${exp}`).digest("base64url");

/** Id-ul sesiunii de site (hash-ul token-ului), ca la logout panoul să se închidă și el. */
async function idSesiune() {
  const token = (await cookies()).get("sesiune")?.value;
  return token ? createHash("sha256").update(token).digest("hex") : null;
}

/** Deschide panoul pentru sesiunea curentă. Se apelează doar după verificarea emailului și a parolei. */
export async function deschidePanou(tokenSesiune?: string) {
  const sesiune = tokenSesiune ? createHash("sha256").update(tokenSesiune).digest("hex") : await idSesiune();
  if (!sesiune) return;
  const exp = Date.now() + DURATA_MS;
  (await cookies()).set(COOKIE, `${exp}.${semnatura(sesiune, exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function inchidePanou() {
  (await cookies()).delete(COOKIE);
}

export async function panouDeschis() {
  const [exp, sig] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  const sesiune = await idSesiune();
  if (!sesiune || !sig || !(Number(exp) > Date.now())) return false;
  const corect = Buffer.from(semnatura(sesiune, Number(exp)));
  const primit = Buffer.from(sig);
  return corect.length === primit.length && timingSafeEqual(corect, primit);
}

/** Administratorul cu panoul deschis, sau null. */
export async function adminPanou() {
  const u = await utilizatorCurent();
  return esteAdmin(u?.email) && (await panouDeschis()) ? u : null;
}

/** Pentru paginile și acțiunile din /admin: altcineva primește 404, administratorul fără parolă e trimis la intrare. */
export async function cerePanou() {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  if (!(await panouDeschis())) redirect("/admin");
  return u!;
}
