"use server";

import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { brevo, expeditor, trimiteEmail } from "@/lib/email";
import { adaugaRanduri } from "@/lib/netlify-dns";

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

/** Pune în Netlify DNS rândurile cerute de Brevo, apoi cere verificarea. */
export async function puneInNetlify() {
  await admin();
  const d = await brevo("GET", `/senders/domains/${domeniu()}`);
  const randuri = Object.values((d.date?.dns_records ?? {}) as Record<string, { type?: string; host_name?: string; value?: string }>)
    .filter((r) => r?.type && r.value)
    .map((r) => {
      const h = (r.host_name ?? "").replace(/\.$/, "");
      const nume = !h || h === "@" ? domeniu() : h.endsWith(domeniu()) ? h : `${h}.${domeniu()}`;
      return { type: r.type!, hostname: nume, value: r.value! };
    });
  await adaugaRanduri(domeniu(), randuri);
  await verificaDomeniul();
}

/** cheiamea.com și www-urile arată spre serverul Oracle; Caddy le redirecționează la cheiamea.ro. */
export async function leagaDomeniile() {
  await admin();
  const ip = "158.180.27.245";
  await adaugaRanduri("cheiamea.ro", [{ type: "A", hostname: "www.cheiamea.ro", value: ip }]);
  await adaugaRanduri("cheiamea.com", [
    { type: "A", hostname: "cheiamea.com", value: ip },
    { type: "A", hostname: "www.cheiamea.com", value: ip },
  ]);
  revalidatePath("/admin/email");
}
