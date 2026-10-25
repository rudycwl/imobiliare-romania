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

/** Șterge definitiv un anunț, cu pozele lui (ex. anunțuri de test). Contul proprietarului rămâne. */
export async function stergeAnunt(_: StareStergere, f: FormData): Promise<StareStergere> {
  const admin = await utilizatorCurent();
  if (!esteAdmin(admin?.email)) return { eroare: "Doar administratorul poate șterge anunțuri." };
  const id = Number(String(f.get("id") ?? "").replace(/\D/g, ""));
  if (!Number.isInteger(id) || id <= 0) return { eroare: "Scrie numărul anunțului (ex. 12, din linkul cheiamea.ro/anunt/12)." };
  if (Number(String(f.get("confirmare") ?? "").replace(/\D/g, "")) !== id) return { eroare: "Scrie din nou numărul anunțului, ca să confirmi." };
  const a = await db.anunt.findUnique({ where: { id }, select: { titlu: true, poze: { select: { cheie: true } } } });
  if (!a) return { eroare: `Nu există anunțul #${id}.` };
  await Promise.all(a.poze.map((p) => stergeObiect(p.cheie).catch((e) => console.error("Poză", e))));
  // Pozele, statisticile și favoritele anunțului se șterg odată cu el (onDelete: Cascade).
  await db.anunt.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: `Anunțul #${id} („${a.titlu}”) a fost șters, cu ${a.poze.length} poze.` };
}
