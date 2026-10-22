"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { creeazaInvitatie, esteAdmin } from "@/lib/fondatori";

export async function genereazaInvitatie(f: FormData) {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  const nota = String(f.get("nota") ?? "").trim().slice(0, 120) || null;
  await creeazaInvitatie(nota);
  revalidatePath("/admin/invitatii");
  revalidatePath("/pentru-agentii");
}
