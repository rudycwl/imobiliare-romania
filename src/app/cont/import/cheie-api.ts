"use server";

import { utilizatorCurent } from "@/lib/auth";
import { anuleazaCheieApi, genereazaCheieApi } from "@/lib/api-agentii";

export type StareCheie = { cheie?: string; anulata?: boolean; eroare?: string } | undefined;

export async function cheieApi(_: StareCheie, f: FormData): Promise<StareCheie> {
  const u = await utilizatorCurent();
  if (!u || u.tip !== "agentie") return { eroare: "Cheia API e disponibilă doar pentru conturile de agenție." };
  if (!u.emailConfirmat) return { eroare: "Confirmă întâi adresa de email a contului." };
  if (f.get("actiune") === "anuleaza") {
    await anuleazaCheieApi(u.id);
    return { anulata: true };
  }
  return { cheie: await genereazaCheieApi(u.id) };
}
