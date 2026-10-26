"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deschideSesiune, utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { ipClient, noteaza, permis, sterge } from "@/lib/limita";
import { deschidePanou, inchidePanou } from "@/lib/panou";

const MIN15 = 15 * 60_000;

export type StareIntrare = { eroare?: string; email?: string } | undefined;

/** Intrarea în panou: email și parolă de administrator, de fiecare dată. */
export async function intraInPanou(_: StareIntrare, f: FormData): Promise<StareIntrare> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const ip = await ipClient();
  if (!permis(`panou:${email}`, 5, MIN15) || !permis(`panou-ip:${ip}`, 10, MIN15))
    return { eroare: "Prea multe încercări greșite. Așteaptă 15 minute.", email };
  const u = esteAdmin(email) ? await db.utilizator.findUnique({ where: { email } }) : null;
  const ok = u?.parolaHash && !u.stersLa && (await bcrypt.compare(String(f.get("parola") ?? ""), u.parolaHash));
  if (!u || !ok) {
    noteaza(`panou:${email}`);
    noteaza(`panou-ip:${ip}`);
    return { eroare: "Email sau parolă greșită.", email };
  }
  sterge(`panou:${email}`);
  const curent = await utilizatorCurent();
  await deschidePanou(curent?.id === u.id ? undefined : await deschideSesiune(u.id));
  redirect("/admin");
}

export async function iesiDinPanou() {
  await inchidePanou();
  redirect("/");
}
