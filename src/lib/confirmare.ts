import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { adresaSite, trimiteEmail } from "./email";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Trimite linkul de confirmare a emailului; un link nou îl anulează pe cel vechi. */
export async function trimiteConfirmare(utilizatorId: string) {
  const u = await db.utilizator.findUnique({ where: { id: utilizatorId } });
  if (!u?.email || u.emailConfirmatLa || u.stersLa) return false;
  const token = randomBytes(32).toString("base64url");
  await db.utilizator.update({ where: { id: u.id }, data: { confirmareHash: hash(token) } });
  return trimiteEmail({
    catre: u.email,
    subiect: "Confirmă adresa de email pentru CheiaMea",
    paragrafe: [
      `Bună ziua${u.contact || u.nume ? ", " + (u.contact || u.nume) : ""}!`,
      "Mulțumim că ți-ai făcut cont pe CheiaMea. Apasă butonul de mai jos ca să confirmi că adresa de email e a ta. Așa primești alertele pentru căutări și poți recupera parola oricând.",
      "Dacă nu ți-ai făcut tu cont, ignoră acest email.",
    ],
    buton: { text: "Confirmă emailul", link: `${adresaSite()}/cont/confirma?t=${token}` },
  });
}

/** Marchează emailul confirmat; întoarce false pentru un link necunoscut sau deja folosit. */
export async function confirmaEmail(token: string) {
  if (!token) return false;
  const r = await db.utilizator.updateMany({
    where: { confirmareHash: hash(token), stersLa: null },
    data: { emailConfirmatLa: new Date(), confirmareHash: null },
  });
  return r.count > 0;
}
