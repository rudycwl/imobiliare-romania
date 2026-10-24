"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deschideSesiune } from "@/lib/auth";
import { adresaSite, trimiteEmail } from "@/lib/email";
import { ipClient, noteaza, permis } from "@/lib/limita";

export type StareParola = { eroare?: string; trimis?: boolean } | undefined;

const VALABIL_MS = 60 * 60 * 1000;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Trimite linkul de resetare. Răspunsul e același și când emailul nu are cont, ca să nu se poată afla cine e înscris. */
export async function cereResetare(_: StareParola, f: FormData): Promise<StareParola> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { eroare: "Adresa de email nu e validă." };
  const ip = await ipClient();
  if (!permis(`resetare:${ip}`, 10, 60 * 60_000)) return { eroare: "Prea multe cereri de la această conexiune. Încearcă peste o oră." };
  noteaza(`resetare:${ip}`);
  const u = await db.utilizator.findUnique({ where: { email } });
  if (u && !u.stersLa) {
    // Cel mult 3 linkuri pe oră pentru un cont, ca formularul să nu poată fi folosit pentru a umple o căsuță de email.
    const recente = await db.resetareParola.count({ where: { utilizatorId: u.id, creatLa: { gt: new Date(Date.now() - VALABIL_MS) } } });
    if (recente < 3) {
      const token = randomBytes(32).toString("base64url");
      await db.resetareParola.create({ data: { id: hash(token), utilizatorId: u.id, expiraLa: new Date(Date.now() + VALABIL_MS) } });
      const trimis = await trimiteEmail({
        catre: email,
        subiect: "Resetează parola contului CheiaMea",
        paragrafe: [
          `Bună ziua${u.contact || u.nume ? ", " + (u.contact || u.nume) : ""}!`,
          "Cineva (sperăm că tu) a cerut o parolă nouă pentru contul tău de pe CheiaMea. Apasă butonul de mai jos și alege parola nouă. Linkul e valabil o oră.",
          "Dacă nu ai cerut tu, ignoră acest email: parola ta rămâne aceeași.",
        ],
        buton: { text: "Alege parola nouă", link: `${adresaSite()}/cont/parola-noua?t=${token}` },
      });
      if (!trimis) return { eroare: "Nu am putut trimite emailul acum. Scrie-ne la contact@cheiamea.ro și te ajutăm." };
    }
  }
  return { trimis: true };
}

export async function seteazaParola(_: StareParola, f: FormData): Promise<StareParola> {
  const token = String(f.get("t") ?? "");
  const parola = String(f.get("parola") ?? "");
  if (parola.length < 8) return { eroare: "Parola trebuie să aibă cel puțin 8 caractere." };
  if (parola !== String(f.get("parola2") ?? "")) return { eroare: "Cele două parole nu sunt la fel." };
  const r = await db.resetareParola.findUnique({ where: { id: hash(token) } });
  if (!r || r.expiraLa < new Date()) return { eroare: "Linkul a expirat sau a fost deja folosit. Cere unul nou." };
  await db.$transaction([
    db.utilizator.update({ where: { id: r.utilizatorId }, data: { parolaHash: await bcrypt.hash(parola, 10) } }),
    // Linkul a venit pe email, deci adresa e a lui.
    db.utilizator.updateMany({ where: { id: r.utilizatorId, emailConfirmatLa: null }, data: { emailConfirmatLa: new Date(), confirmareHash: null } }),
    // Linkurile rămase și sesiunile deschise pe alte dispozitive nu mai sunt valabile.
    db.resetareParola.deleteMany({ where: { utilizatorId: r.utilizatorId } }),
    db.sesiune.deleteMany({ where: { utilizatorId: r.utilizatorId } }),
  ]);
  await deschideSesiune(r.utilizatorId);
  redirect("/cont");
}
