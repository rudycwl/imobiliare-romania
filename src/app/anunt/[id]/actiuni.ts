"use server";

import { revalidatePath } from "next/cache";
import { ipClient, noteaza, permis } from "@/lib/limita";
import { amprenta, MOTIVE_RAPORTARE, raporteaza, type MotivRaportare } from "@/lib/moderare";

export type StareRaportare = { ok?: boolean; eroare?: string } | undefined;

export async function raporteazaAnunt(_: StareRaportare, f: FormData): Promise<StareRaportare> {
  const id = Number(f.get("id"));
  const motiv = String(f.get("motiv") ?? "");
  const detalii = String(f.get("detalii") ?? "").trim().slice(0, 1000) || null;
  if (!Number.isInteger(id) || !(motiv in MOTIVE_RAPORTARE)) return { eroare: "Alege motivul raportării." };
  // Adresa reală pusă de Caddy, nu prima din X-Forwarded-For (pe aceea o poate scrie oricine în cerere).
  const ip = await ipClient();
  if (!permis(`raport:${ip}`, 10, 60 * 60_000)) return { eroare: "Prea multe raportări de la această conexiune. Încearcă peste o oră." };
  noteaza(`raport:${ip}`);
  const ok = await raporteaza(id, motiv as MotivRaportare, detalii, amprenta(ip));
  if (!ok) return { eroare: "Anunțul nu mai există." };
  // Dacă raportarea a atins pragul, anunțul a ieșit de pe site: paginile cache-uite trebuie refăcute.
  revalidatePath(`/anunt/${id}`);
  revalidatePath("/");
  return { ok: true };
}
