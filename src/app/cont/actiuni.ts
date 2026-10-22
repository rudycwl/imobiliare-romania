"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deschideSesiune, inchideSesiune, utilizatorCurent } from "@/lib/auth";
import { creeazaAnunt } from "@/lib/anunturi";
import { esteTipUtilizator, slugify, TIPURI, TRANZACTII } from "@/lib/etichete";
import { getOras } from "@/lib/geo";

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
    if (tip === "agentie") revalidatePath("/agentii");
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
  redirect("/cont");
}

export async function deconectare() {
  await inchideSesiune();
  redirect("/");
}

export async function publicaAnunt(_: Stare, f: FormData): Promise<Stare> {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const tip = text(f, "tip");
  const tranzactie = text(f, "tranzactie");
  const titlu = text(f, "titlu");
  const descriere = text(f, "descriere");
  const pret = Number(f.get("pret"));
  const suprafata = Number(f.get("suprafata"));
  const camere = Number(f.get("camere")) || null;
  const judet = text(f, "judet");
  const oras = text(f, "oras");

  if (!(tip in TIPURI) || !(tranzactie in TRANZACTII)) return esec("Alege tipul proprietății și tranzacția.", f);
  if (titlu.length < 10) return esec("Titlul trebuie să aibă cel puțin 10 caractere.", f);
  if (!(pret > 0) || !(suprafata > 0)) return esec("Prețul și suprafața trebuie să fie pozitive.", f);
  if (!getOras(judet, oras)) return esec("Alege județul și orașul.", f);

  const a = await creeazaAnunt(u.id, {
    titlu,
    descriere,
    tip: tip as keyof typeof TIPURI,
    tranzactie: tranzactie as keyof typeof TRANZACTII,
    pret: Math.round(pret),
    suprafata: Math.round(suprafata),
    camere,
    judet,
    oras,
    zona: text(f, "zona") || "Centru",
  });
  // Paginile cache-uite (ISR) arată anunțul nou imediat, nu după expirare.
  revalidatePath("/");
  if (u.tip === "agentie") revalidatePath(`/agentii/${u.slug}`);
  redirect(`/anunt/${a.id}`);
}
