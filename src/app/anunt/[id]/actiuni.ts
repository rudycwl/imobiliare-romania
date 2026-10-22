"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { amprenta, MOTIVE_RAPORTARE, raporteaza, type MotivRaportare } from "@/lib/moderare";

export type StareRaportare = { ok?: boolean; eroare?: string } | undefined;

export async function raporteazaAnunt(_: StareRaportare, f: FormData): Promise<StareRaportare> {
  const id = Number(f.get("id"));
  const motiv = String(f.get("motiv") ?? "");
  const detalii = String(f.get("detalii") ?? "").trim().slice(0, 1000) || null;
  if (!Number.isInteger(id) || !(motiv in MOTIVE_RAPORTARE)) return { eroare: "Alege motivul raportării." };
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ok = await raporteaza(id, motiv as MotivRaportare, detalii, amprenta(ip, h.get("user-agent") ?? ""));
  if (!ok) return { eroare: "Anunțul nu mai există." };
  // Dacă raportarea a atins pragul, anunțul a ieșit de pe site: paginile cache-uite trebuie refăcute.
  revalidatePath(`/anunt/${id}`);
  revalidatePath("/");
  return { ok: true };
}
