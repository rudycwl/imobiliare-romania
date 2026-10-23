"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { importaCsv, type RezultatImport } from "@/lib/import-masa";
import { completeazaCoordonate } from "@/lib/geocodare";

export type StareImport = (RezultatImport & { eroare?: undefined }) | { eroare: string; importate?: undefined } | undefined;

const MAX_FISIER = 3 * 1024 * 1024;

export async function importa(_: StareImport, f: FormData): Promise<StareImport> {
  const u = await utilizatorCurent();
  if (!u || u.tip !== "agentie") return { eroare: "Importul în masă e disponibil doar pentru conturile de agenție." };
  const fisier = f.get("fisier");
  if (!(fisier instanceof File) || !fisier.size) return { eroare: "Alege fișierul CSV." };
  if (fisier.size > MAX_FISIER) return { eroare: "Fișierul e mai mare de 3 MB. Împarte-l în mai multe fișiere." };
  const r = await importaCsv(u.id, await fisier.text());
  if (r.importate) {
    // Coordonatele pe hartă se caută în fundal, câte un anunț pe secundă.
    after(() => completeazaCoordonate(Math.min(r.importate, 200)));
    revalidatePath("/");
    revalidatePath(`/agentii/${u.slug}`);
  }
  return r;
}
