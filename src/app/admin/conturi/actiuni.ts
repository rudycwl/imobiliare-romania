"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { stergeObiect } from "@/lib/stocare";

export type StareStergere = { eroare?: string; ok?: string } | undefined;

/**
 * Șterge complet un cont (ex. contul de test pentru NETOPIA): anunțuri, poze, comenzi, sesiuni.
 * Un cont cu facturi emise nu se șterge complet, pentru că legea contabilă cere păstrarea lor.
 */
export async function stergeComplet(_: StareStergere, f: FormData): Promise<StareStergere> {
  const admin = await utilizatorCurent();
  if (!esteAdmin(admin?.email)) return { eroare: "Doar administratorul poate șterge conturi." };
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (String(f.get("confirmare") ?? "").trim() !== email) return { eroare: "Scrie din nou emailul contului, exact, ca să confirmi." };
  const u = await db.utilizator.findUnique({ where: { email } });
  if (!u) return { eroare: "Nu există un cont cu acest email." };
  if (esteAdmin(u.email)) return { eroare: "Contul de administrator nu se poate șterge de aici." };
  const facturi = await db.factura.count({ where: { utilizatorId: u.id, stare: { in: ["emisa", "stornata"] } } });
  if (facturi) return { eroare: `Contul are ${facturi} facturi emise. Facturile trebuie păstrate; contul poate fi șters doar de titular, din Setări.` };
  const poze = await db.poza.findMany({ where: { anunt: { proprietarId: u.id } }, select: { cheie: true } });
  await Promise.all(poze.map((p) => stergeObiect(p.cheie).catch((e) => console.error("Poză", e))));
  // Anunțurile, comenzile, sesiunile, favoritele și căutările se șterg odată cu contul (onDelete: Cascade).
  await db.utilizator.delete({ where: { id: u.id } });
  revalidatePath("/", "layout");
  return { ok: `Contul ${email} a fost șters complet, cu ${poze.length} poze.` };
}
