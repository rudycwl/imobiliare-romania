"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { utilizatorCurent } from "@/lib/auth";

export async function stergeCautarea(f: FormData) {
  const u = await utilizatorCurent();
  if (!u) return;
  await db.cautareSalvata.deleteMany({ where: { id: Number(f.get("id")), utilizatorId: u.id } });
  revalidatePath("/cont/cautari");
}

export async function comutaAlerta(f: FormData) {
  const u = await utilizatorCurent();
  if (!u) return;
  await db.cautareSalvata.updateMany({
    where: { id: Number(f.get("id")), utilizatorId: u.id },
    // La repornire, alerta nu trimite anunțurile adunate cât a fost oprită.
    data: f.get("porneste") ? { alertaEmail: true, alertaLa: new Date() } : { alertaEmail: false },
  });
  revalidatePath("/cont/cautari");
}
