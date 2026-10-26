"use server";

import { revalidatePath } from "next/cache";
import { cerePanou } from "@/lib/panou";
import { schimbaAscuns } from "@/lib/continut-db";

/** Ascunde sau arată din nou o știre sau un oraș; se refac toate paginile (start, legislație, impozite, orașe). */
export async function comuta(f: FormData) {
  await cerePanou();
  const cheie = String(f.get("cheie") ?? "").slice(0, 600);
  if (!cheie) return;
  await schimbaAscuns(cheie, f.get("ascunde") === "1");
  revalidatePath("/", "layout");
}
