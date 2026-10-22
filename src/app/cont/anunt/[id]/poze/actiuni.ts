"use server";

import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { adaugaPoza, cheieNoua, facePrima, MAX_MARIME, MAX_POZE, stergePoza, TIPURI_POZE } from "@/lib/poze";
import { asiguraCors, exista, stocareConfigurata, urlIncarcare } from "@/lib/stocare";

async function anuntPropriu(anuntId: number) {
  const u = await utilizatorCurent();
  if (!u || !Number.isInteger(anuntId)) return null;
  return db.anunt.findFirst({ where: { id: anuntId, proprietarId: u.id } });
}

function reimprospateaza(a: { id: number; judet: string; oras: string }) {
  revalidatePath(`/anunt/${a.id}`);
  revalidatePath(`/${a.judet}/${a.oras}`);
  revalidatePath(`/cont/anunt/${a.id}/poze`);
  revalidatePath(`/cont/anunt/${a.id}/editeaza`);
}

/** Pasul 1: browserul cere un URL semnat și încarcă poza direct în stocare. */
export async function cerereIncarcare(anuntId: number, tip: string, marime: number) {
  if (!stocareConfigurata()) return { eroare: "Încărcarea pozelor nu e încă activă." };
  const a = await anuntPropriu(anuntId);
  if (!a) return { eroare: "Anunțul nu există." };
  if (!TIPURI_POZE.includes(tip) || !(marime > 0) || marime > MAX_MARIME) return { eroare: "Poza trebuie să fie JPG sau WebP, de cel mult 2 MB." };
  if ((await db.poza.count({ where: { anuntId } })) >= MAX_POZE) return { eroare: `Poți adăuga cel mult ${MAX_POZE} poze.` };
  const cheie = cheieNoua(anuntId, tip);
  await asiguraCors();
  return { url: urlIncarcare(cheie, tip, marime), cheie };
}

/** Pasul 2: după încărcare, poza se leagă de anunț. */
export async function confirmaPoza(anuntId: number, cheie: string) {
  const a = await anuntPropriu(anuntId);
  if (!a || !cheie.startsWith(`anunturi/${anuntId}/`)) return { eroare: "Poza nu e validă." };
  if ((await db.poza.count({ where: { anuntId } })) >= MAX_POZE) return { eroare: `Poți adăuga cel mult ${MAX_POZE} poze.` };
  if (!(await exista(cheie))) return { eroare: "Poza nu a ajuns în stocare. Încearcă din nou." };
  await adaugaPoza(anuntId, cheie);
  reimprospateaza(a);
  return {};
}

export async function stergePozaActiune(f: FormData) {
  const a = await anuntPropriu(Number(f.get("anunt")));
  if (!a) return;
  await stergePoza(a.id, Number(f.get("poza")));
  reimprospateaza(a);
}

export async function facePrimaActiune(f: FormData) {
  const a = await anuntPropriu(Number(f.get("anunt")));
  if (!a) return;
  await facePrima(a.id, Number(f.get("poza")));
  reimprospateaza(a);
}
