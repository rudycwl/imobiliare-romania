"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { brevo, expeditor, trimiteEmail } from "@/lib/email";
import { adaugaRanduri } from "@/lib/netlify-dns";

const domeniu = () => expeditor().split("@")[1];

/** Mesajul de după apăsarea unui buton: pagina îl arată sus, ca să se vadă ce a răspuns Brevo sau Netlify. */
function gata(mesaj: string, ok: boolean): never {
  revalidatePath("/admin/email");
  redirect(`/admin/email?${new URLSearchParams({ m: mesaj.slice(0, 400), ok: ok ? "1" : "0" })}`);
}

const eroareBrevo = (date: any) => `Brevo a refuzat: ${date?.message ?? date?.code ?? JSON.stringify(date)}`;

async function admin() {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) throw new Error("Doar administratorul.");
  return u!;
}

/** Adaugă domeniul în Brevo (o singură dată); Brevo întoarce rândurile DNS de pus la domeniu. */
export async function adaugaDomeniul() {
  await admin();
  const r = await brevo("POST", "/senders/domains", { name: domeniu() });
  if (!r.ok) gata(eroareBrevo(r.date), false);
  gata(`Domeniul ${domeniu()} a fost adăugat în Brevo.`, true);
}

/** Cere lui Brevo să verifice rândurile DNS și, dacă e nevoie, creează expeditorul noreply@. */
async function verifica(): Promise<string> {
  const v = await brevo("PUT", `/senders/domains/${domeniu()}/authenticate`);
  const s = await brevo("GET", "/senders");
  const exista = (s.date?.senders ?? []).some((x: { email?: string }) => x.email?.toLowerCase() === expeditor());
  if (!exista) await brevo("POST", "/senders", { name: "CheiaMea", email: expeditor() });
  return v.ok
    ? "Brevo a verificat rândurile DNS. Dacă unele apar încă „lipsește”, mai așteaptă câteva minute și apasă din nou „Verifică”."
    : `Verificarea nu a trecut încă (${v.date?.message ?? "rândurile DNS nu se văd încă"}). Mai așteaptă câteva minute și apasă din nou „Verifică”.`;
}

export async function verificaDomeniul() {
  await admin();
  gata(await verifica(), true);
}

export async function emailDeTest() {
  const u = await admin();
  const ok = await trimiteEmail({
    catre: u.email!,
    subiect: "Test CheiaMea: emailurile site-ului merg",
    paragrafe: ["Dacă citești asta, site-ul poate trimite emailuri: „Am uitat parola” și alertele pentru căutările salvate funcționează."],
  });
  if (!ok) {
    const r = await brevo("GET", "/account");
    gata(r.ok ? "Brevo nu a trimis emailul: domeniul nu e încă verificat. Pune întâi rândurile DNS." : eroareBrevo(r.date), false);
  }
  gata(`Email de test trimis la ${u.email}. Uită-te și în Spam.`, true);
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
  if (!randuri.length) gata(d.ok ? "Brevo nu a dat rânduri DNS. Apasă întâi „Adaugă în Brevo”." : eroareBrevo(d.date), false);
  let rez;
  try {
    rez = await adaugaRanduri(domeniu(), randuri);
  } catch (e) {
    gata(`Netlify a refuzat: ${e instanceof Error ? e.message : e}. Verifică NETLIFY_TOKEN în /configurare.`, false);
  }
  const pusi = rez.adaugate.length ? `Am pus în Netlify: ${rez.adaugate.join(", ")}.` : "Rândurile erau deja în Netlify.";
  const sarite = rez.sarite.length ? ` Sărite: ${rez.sarite.join(", ")}.` : "";
  gata(`${pusi}${sarite} ${await verifica()}`, true);
}

/** cheiamea.com și www-urile arată spre serverul Oracle; Caddy le redirecționează la cheiamea.ro. */
export async function leagaDomeniile() {
  await admin();
  const ip = "158.180.27.245";
  let a, b;
  try {
    a = await adaugaRanduri("cheiamea.ro", [{ type: "A", hostname: "www.cheiamea.ro", value: ip }]);
    b = await adaugaRanduri("cheiamea.com", [
      { type: "A", hostname: "cheiamea.com", value: ip },
      { type: "A", hostname: "www.cheiamea.com", value: ip },
    ]);
  } catch (e) {
    gata(`Netlify a refuzat: ${e instanceof Error ? e.message : e}. Verifică NETLIFY_TOKEN în /configurare.`, false);
  }
  const adaugate = [...a.adaugate, ...b.adaugate];
  const sarite = [...a.sarite, ...b.sarite];
  gata(`${adaugate.length ? `Adăugate: ${adaugate.join(", ")}.` : "Rândurile erau deja puse."}${sarite.length ? ` Sărite: ${sarite.join(", ")}.` : ""}`, true);
}

/**
 * Căsuțele de email (contact@, agentii@) stau la Zoho Mail (centrul de date UE). Pune în Netlify DNS:
 * codul de verificare Zoho, MX-urile, SPF-ul și, când e dat, cheia DKIM. Toate vin din textul lipit din Zoho.
 */
export async function puneZoho(f: FormData) {
  await admin();
  const text = String(f.get("zoho") ?? "");
  const verificare = text.match(/zoho-verification=[\w.-]+/)?.[0];
  const dkim = text.match(/v=DKIM1;[^"\n\r]+/)?.[0]?.trim();
  const selector = String(f.get("selector") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!verificare && !dkim) gata("Nu găsesc în text nici codul „zoho-verification=…”, nici cheia „v=DKIM1; …”. Copiază din Zoho tot rândul.", false);
  if (dkim && !selector) gata("Pentru cheia DKIM scrie și selectorul (numele lui din Zoho, de ex. zmail).", false);
  // Centrul de date al contului Zoho (se vede în adresa din browser: zoho.eu sau zoho.com).
  const dc = f.get("dc") === "com" ? "com" : "eu";
  const d = domeniu();
  const randuri = [
    ...(verificare ? [{ type: "TXT", hostname: d, value: verificare }] : []),
    { type: "MX", hostname: d, value: `mx.zoho.${dc}`, priority: 10 },
    { type: "MX", hostname: d, value: `mx2.zoho.${dc}`, priority: 20 },
    { type: "MX", hostname: d, value: `mx3.zoho.${dc}`, priority: 50 },
    { type: "TXT", hostname: d, value: `v=spf1 include:zohomail.${dc} ~all` },
    ...(dkim ? [{ type: "TXT", hostname: `${selector}._domainkey.${d}`, value: dkim }] : []),
  ];
  let rez;
  try {
    rez = await adaugaRanduri(d, randuri);
  } catch (e) {
    gata(`Netlify a refuzat: ${e instanceof Error ? e.message : e}. Verifică NETLIFY_TOKEN în /configurare.`, false);
  }
  const pusi = rez.adaugate.length ? `Am pus în Netlify: ${rez.adaugate.join(", ")}.` : "Rândurile erau deja în Netlify.";
  const sarite = rez.sarite.length ? ` Sărite: ${rez.sarite.join(", ")}.` : "";
  gata(`${pusi}${sarite} Acum, în Zoho, apasă „Verify” (poate dura câteva minute până vede rândurile).`, true);
}

/**
 * Varianta fără Zoho: ImprovMX (gratuit) primește mailurile pentru contact@ și agentii@ și le trimite în Gmail-ul firmei,
 * iar răspunsurile pleacă din Gmail ca agentii@ prin Brevo (SMTP). Pune MX-urile ImprovMX și un SPF care le acoperă pe amândouă.
 */
export async function puneImprovmx() {
  await admin();
  const d = domeniu();
  let rez;
  try {
    rez = await adaugaRanduri(d, [
      { type: "MX", hostname: d, value: "mx1.improvmx.com", priority: 10 },
      { type: "MX", hostname: d, value: "mx2.improvmx.com", priority: 20 },
      { type: "TXT", hostname: d, value: "v=spf1 include:spf.improvmx.com include:spf.brevo.com ~all" },
    ]);
  } catch (e) {
    gata(`Netlify a refuzat: ${e instanceof Error ? e.message : e}. Verifică NETLIFY_TOKEN în /configurare.`, false);
  }
  const pusi = rez.adaugate.length ? `Am pus în Netlify: ${rez.adaugate.join(", ")}.` : "Rândurile erau deja în Netlify.";
  const sarite = rez.sarite.length ? ` Sărite: ${rez.sarite.join(", ")}.` : "";
  gata(`${pusi}${sarite} Acum, în ImprovMX, apasă „Check again” (poate dura câteva minute).`, true);
}
