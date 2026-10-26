"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cerePanou } from "@/lib/panou";
import { creeazaInvitatie } from "@/lib/fondatori";

export async function genereazaInvitatie(f: FormData) {
  const u = await cerePanou();
  const nota = String(f.get("nota") ?? "").trim().slice(0, 120) || null;
  await creeazaInvitatie(nota);
  revalidatePath("/admin/invitatii");
  revalidatePath("/pentru-agentii");
}
