"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deschideSesiune, inchideSesiune, utilizatorCurent } from "@/lib/auth";
import { getOras } from "@/lib/geo";
import { stergeObiect } from "@/lib/stocare";
import { LUNGIME, preaLung } from "@/lib/lungimi";

export type StareSetari = { eroare?: string; ok?: string } | undefined;

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function autentificat() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  return u;
}

async function parolaCorecta(id: string, parola: string) {
  const r = await db.utilizator.findUnique({ where: { id }, select: { parolaHash: true } });
  return !!r?.parolaHash && (await bcrypt.compare(parola, r.parolaHash));
}

/** Numele, persoana de contact, telefonul și localitatea. Emailul rămâne cel de la înregistrare. */
export async function salveazaDate(_: StareSetari, f: FormData): Promise<StareSetari> {
  const u = await autentificat();
  const juridic = u.tip !== "persoana-fizica";
  const nume = text(f, "nume");
  const contact = juridic ? text(f, "contact") || null : null;
  const telefon = text(f, "telefon").replace(/\s/g, "");
  const judet = text(f, "judet");
  const oras = text(f, "oras");
  if (nume.length < 2) return { eroare: "Completează numele." };
  const lung = preaLung([["Numele", nume, LUNGIME.nume], ["Persoana de contact", contact, LUNGIME.nume]]);
  if (lung) return { eroare: lung };
  if (!/^0\d{9}$/.test(telefon)) return { eroare: "Telefonul trebuie să aibă 10 cifre și să înceapă cu 0." };
  if (!getOras(judet, oras)) return { eroare: "Alege județul și orașul." };
  await db.utilizator.update({ where: { id: u.id }, data: { nume, contact, telefon, judet, oras } });
  // Numele și telefonul apar pe paginile anunțurilor, care sunt cache-uite.
  revalidatePath("/", "layout");
  return { ok: "Datele au fost salvate." };
}

export async function schimbaParola(_: StareSetari, f: FormData): Promise<StareSetari> {
  const u = await autentificat();
  const noua = String(f.get("noua") ?? "");
  if (!(await parolaCorecta(u.id, String(f.get("actuala") ?? "")))) return { eroare: "Parola actuală nu e corectă." };
  if (noua.length < 8) return { eroare: "Parola nouă trebuie să aibă cel puțin 8 caractere." };
  if (noua.length > LUNGIME.parola) return { eroare: `Parola nouă poate avea cel mult ${LUNGIME.parola} de caractere.` };
  if (noua !== String(f.get("repetare") ?? "")) return { eroare: "Cele două parole noi nu sunt la fel." };
  await db.utilizator.update({ where: { id: u.id }, data: { parolaHash: await bcrypt.hash(noua, 10) } });
  // Celelalte dispozitive conectate trebuie să se autentifice din nou, cu parola nouă.
  await db.sesiune.deleteMany({ where: { utilizatorId: u.id } });
  await deschideSesiune(u.id);
  return { ok: "Parola a fost schimbată." };
}

/**
 * Șterge contul: anunțurile și pozele dispar, datele personale se golesc.
 * Comenzile și facturile rămân (fără date de contact), pentru că legea contabilă cere păstrarea lor.
 */
export async function stergeCont(_: StareSetari, f: FormData): Promise<StareSetari> {
  const u = await autentificat();
  if (text(f, "confirmare").toUpperCase() !== "STERGE") return { eroare: "Scrie STERGE în căsuță ca să confirmi." };
  if (!(await parolaCorecta(u.id, String(f.get("parola") ?? "")))) return { eroare: "Parola nu e corectă." };
  const poze = await db.poza.findMany({ where: { anunt: { proprietarId: u.id } }, select: { cheie: true } });
  await Promise.all(poze.map((p) => stergeObiect(p.cheie).catch((e) => console.error("R2", e))));
  await db.$transaction([
    db.anunt.deleteMany({ where: { proprietarId: u.id } }),
    db.favorit.deleteMany({ where: { utilizatorId: u.id } }),
    db.cautareSalvata.deleteMany({ where: { utilizatorId: u.id } }),
    db.sesiune.deleteMany({ where: { utilizatorId: u.id } }),
    db.utilizator.update({
      where: { id: u.id },
      data: { stersLa: new Date(), nume: "Cont șters", contact: null, email: null, parolaHash: null, telefon: "", adresa: null },
    }),
  ]);
  await inchideSesiune();
  revalidatePath("/", "layout");
  redirect("/?cont=sters");
}
