"use server";

import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { brevo, expeditor, trimiteEmail } from "@/lib/email";

const domeniu = () => expeditor().split("@")[1];

async function admin() {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) throw new Error("Doar administratorul.");
  return u!;
}

/** Adaugă domeniul în Brevo (o singură dată); Brevo întoarce rândurile DNS de pus la domeniu. */
export async function adaugaDomeniul() {
  await admin();
  await brevo("POST", "/senders/domains", { name: domeniu() });
  revalidatePath("/admin/email");
}

/** Cere lui Brevo să verifice rândurile DNS și, dacă e nevoie, creează expeditorul noreply@. */
export async function verificaDomeniul() {
  await admin();
  await brevo("PUT", `/senders/domains/${domeniu()}/authenticate`);
  const s = await brevo("GET", "/senders");
  const exista = (s.date?.senders ?? []).some((x: { email?: string }) => x.email?.toLowerCase() === expeditor());
  if (!exista) await brevo("POST", "/senders", { name: "CheiaMea", email: expeditor() });
  revalidatePath("/admin/email");
}

export async function emailDeTest() {
  const u = await admin();
  await trimiteEmail({
    catre: u.email!,
    subiect: "Test CheiaMea: emailurile site-ului merg",
    paragrafe: ["Dacă citești asta, site-ul poate trimite emailuri: „Am uitat parola” și alertele pentru căutările salvate funcționează."],
  });
}
