"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deschideSesiune, inchideSesiune, utilizatorCurent } from "@/lib/auth";
import { creeazaAnunt, editeaza, poatePublica, prelungesteAnunt, retrageAnunt, type AnuntNou } from "@/lib/anunturi";
import { ANUNTURI_GRATUITE } from "@/lib/tarife";
import { esteTipUtilizator, slugify, TIPURI, TRANZACTII } from "@/lib/etichete";
import { getOras } from "@/lib/geo";
import { aplicaOfertaFondator } from "@/lib/fondatori";
import { aplicaRecomandare } from "@/lib/atribuire";
import { aplicaFiltru } from "@/lib/moderare";
import { stocareConfigurata } from "@/lib/stocare";

export type Stare = { eroare?: string; valori?: Record<string, string> } | undefined;

// React golește formularul după trimitere; returnăm valorile (fără parolă) ca să nu fie retastate.
const esec = (eroare: string, f: FormData): Stare => ({
  eroare,
  valori: Object.fromEntries([...f.entries()].filter((e): e is [string, string] => typeof e[1] === "string" && e[0] !== "parola")),
});

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function inregistrare(_: Stare, f: FormData): Promise<Stare> {
  const tip = text(f, "tip");
  if (!esteTipUtilizator(tip)) return esec("Alege tipul de cont.", f);
  const juridic = tip !== "persoana-fizica";
  const persoana = text(f, "nume");
  const denumire = juridic ? text(f, "denumire") : persoana;
  const cui = juridic ? text(f, "cui").toUpperCase().replace(/\s/g, "") : null;
  const email = text(f, "email").toLowerCase();
  const telefon = text(f, "telefon").replace(/\s/g, "");
  const parola = String(f.get("parola") ?? "");
  const judet = text(f, "judet");
  const oras = text(f, "oras");

  if (!denumire || !persoana) return esec("Completează numele.", f);
  if (juridic && !/^(RO)?\d{2,10}$/.test(cui!)) return esec("CUI invalid (ex. RO12345678).", f);
  if (!/^\S+@\S+\.\S+$/.test(email)) return esec("Adresa de email nu e validă.", f);
  if (!/^0\d{9}$/.test(telefon)) return esec("Telefonul trebuie să aibă 10 cifre și să înceapă cu 0.", f);
  if (parola.length < 8) return esec("Parola trebuie să aibă cel puțin 8 caractere.", f);
  if (!getOras(judet, oras)) return esec("Alege județul și orașul.", f);

  try {
    const u = await db.utilizator.create({
      data: {
        tip,
        nume: denumire,
        contact: juridic ? persoana : null,
        cui,
        email,
        telefon,
        judet,
        oras,
        parolaHash: await bcrypt.hash(parola, 10),
        slug: `${slugify(denumire)}-${randomBytes(3).toString("hex")}`,
      },
    });
    await deschideSesiune(u.id);
    await aplicaRecomandare(u.id, tip);
    if (tip === "agentie") {
      await aplicaOfertaFondator(u.id, text(f, "cod"));
      revalidatePath("/agentii");
      revalidatePath("/pentru-agentii");
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return esec("Există deja un cont cu acest email.", f);
    throw e;
  }
  redirect("/cont");
}

export async function autentificare(_: Stare, f: FormData): Promise<Stare> {
  const email = text(f, "email").toLowerCase();
  const u = await db.utilizator.findUnique({ where: { email } });
  const ok = u?.parolaHash && (await bcrypt.compare(String(f.get("parola") ?? ""), u.parolaHash));
  if (!u || !ok) return esec("Email sau parolă greșită.", f);
  await deschideSesiune(u.id);
  const inapoi = text(f, "inapoi");
  redirect(inapoi.startsWith("/") && !inapoi.startsWith("//") ? inapoi : "/cont");
}

export async function deconectare() {
  await inchideSesiune();
  redirect("/");
}

/** Citește și validează câmpurile comune formularelor de adăugare și editare. */
function citesteAnunt(f: FormData): { eroare: string } | { date: AnuntNou } {
  const tip = text(f, "tip");
  const tranzactie = text(f, "tranzactie");
  const titlu = text(f, "titlu");
  const pret = Number(f.get("pret"));
  const suprafata = Number(f.get("suprafata"));
  const judet = text(f, "judet");
  const oras = text(f, "oras");

  if (!(tip in TIPURI) || !(tranzactie in TRANZACTII)) return { eroare: "Alege tipul proprietății și tranzacția." };
  if (titlu.length < 10) return { eroare: "Titlul trebuie să aibă cel puțin 10 caractere." };
  if (!(pret > 0) || !(suprafata > 0)) return { eroare: "Prețul și suprafața trebuie să fie pozitive." };
  if (!getOras(judet, oras)) return { eroare: "Alege județul și orașul." };
  return {
    date: {
      titlu,
      descriere: text(f, "descriere"),
      tip: tip as keyof typeof TIPURI,
      tranzactie: tranzactie as keyof typeof TRANZACTII,
      pret: Math.round(pret),
      suprafata: Math.round(suprafata),
      camere: Number(f.get("camere")) || null,
      judet,
      oras,
      zona: text(f, "zona") || "Centru",
    },
  };
}

export async function publicaAnunt(_: Stare, f: FormData): Promise<Stare> {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const r = citesteAnunt(f);
  if ("eroare" in r) return esec(r.eroare, f);
  if (!(await poatePublica(u))) return esec(MESAJ_LIMITA, f);

  const a = await creeazaAnunt(u.id, r.date);
  await aplicaFiltru(a.id, r.date.titlu, r.date.descriere);
  // Paginile cache-uite (ISR) arată anunțul nou imediat, nu după expirare.
  revalidatePath("/");
  if (u.tip === "agentie") revalidatePath(`/agentii/${u.slug}`);
  // Pozele se adaugă imediat după publicare, dacă stocarea (Cloudflare R2) e configurată.
  redirect(stocareConfigurata() ? `/cont/anunt/${a.id}/poze?nou=1` : `/anunt/${a.id}`);
}

/** Salvează modificările unui anunț propriu; valabilitatea și promovările rămân neschimbate. */
export async function editeazaAnunt(_: Stare, f: FormData): Promise<Stare> {
  const { u, id } = await proprietarSiId(f);
  const r = citesteAnunt(f);
  if ("eroare" in r) return esec(r.eroare, f);
  if (!(await editeaza(id, u.id, r.date))) redirect("/cont");
  await aplicaFiltru(id, r.date.titlu, r.date.descriere);
  revalidatePath("/");
  revalidatePath(`/anunt/${id}`);
  if (u.tip === "agentie") revalidatePath(`/agentii/${u.slug}`);
  redirect(`/anunt/${id}`);
}

const MESAJ_LIMITA = `Ai deja ${ANUNTURI_GRATUITE} anunțuri active, cât permite publicarea gratuită. Retrage un anunț vândut sau închiriat din „Contul meu” și apoi publică-l pe cel nou.`;

async function proprietarSiId(f: FormData) {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const id = Number(f.get("id"));
  if (!Number.isInteger(id)) redirect("/cont");
  return { u, id };
}

function dupaSchimbare(u: { tip: string; slug: string }, id: number) {
  revalidatePath("/");
  revalidatePath(`/anunt/${id}`);
  if (u.tip === "agentie") revalidatePath(`/agentii/${u.slug}`);
  redirect("/cont#anunturile-mele");
}

/** „Retrage” din „Contul meu”: anunțul dispare de pe site. */
export async function retrage(f: FormData) {
  const { u, id } = await proprietarSiId(f);
  await retrageAnunt(id, u.id);
  dupaSchimbare(u, id);
}

/** „Prelungește” / „Reactivează” din „Contul meu”. Eroarea ajunge în pagină prin ?eroare=. */
export async function prelungeste(f: FormData) {
  const { u, id } = await proprietarSiId(f);
  const a = await db.anunt.findFirst({ where: { id, proprietarId: u.id }, select: { expiraLa: true } });
  if (!a) redirect("/cont");
  // Un anunț expirat redevine activ, deci contează la limită; unul încă activ se poate prelungi oricând.
  if (a.expiraLa <= new Date() && !(await poatePublica(u))) redirect("/cont?eroare=limita#anunturile-mele");
  await prelungesteAnunt(id, u.id);
  dupaSchimbare(u, id);
}
