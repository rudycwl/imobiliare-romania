// Rapoarte automate de erori: când o pagină a site-ului crapă (pe server sau în browser), adminii (ADMIN_EMAILS) primesc un email.
// Fără „server-only”: modulul e încărcat și din src/instrumentation.ts. Același email cel mult o dată pe oră, maximum 20 pe zi.

const ORA = 60 * 60_000;
const MAX_PE_ZI = 20;

const g = globalThis as unknown as { __erori?: { trimise: Map<string, number>; zi: string; numar: number } };
const stare = (g.__erori ??= { trimise: new Map(), zi: "", numar: 0 });

export type Eroare = { mesaj: string; unde: string; detalii?: string; sursa: "server" | "browser" };

/** true dacă eroarea trebuie trimisă acum (nu s-a trimis aceeași în ultima oră și nu s-a atins limita zilei). */
export function deTrimis(cheie: string, acum = Date.now()) {
  const zi = new Date(acum).toISOString().slice(0, 10);
  if (stare.zi !== zi) Object.assign(stare, { zi, numar: 0 });
  const ultima = stare.trimise.get(cheie);
  if ((ultima && acum - ultima < ORA) || stare.numar >= MAX_PE_ZI) return false;
  stare.trimise.set(cheie, acum);
  stare.numar++;
  if (stare.trimise.size > 500) for (const [k, t] of stare.trimise) if (acum - t > ORA) stare.trimise.delete(k);
  return true;
}

export async function raporteazaEroare(e: Eroare) {
  // Adresa paginii fără parametri (pot conține date ale vizitatorului).
  const unde = e.unde.split("?")[0].slice(0, 300);
  console.error(`[eroare ${e.sursa}] ${unde}: ${e.mesaj}`);
  const cheie = process.env.BREVO_API_KEY?.trim();
  const catre = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!cheie || !catre.length || !deTrimis(`${e.sursa}|${unde}|${e.mesaj.slice(0, 200)}`)) return;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro").replace(/\/$/, "");
  const text = [
    `O pagină a site-ului a dat eroare (${e.sursa === "server" ? "pe server" : "în browserul unui vizitator"}).`,
    `Pagina: ${site}${unde}`,
    `Eroarea: ${e.mesaj.slice(0, 1000)}`,
    e.detalii ? `Detalii tehnice:\n${e.detalii.slice(0, 3000)}` : "",
    "Trimite acest email lui Claude ca să repare. Aceeași eroare nu se mai trimite timp de o oră.",
  ]
    .filter(Boolean)
    .join("\n\n");
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": cheie, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "CheiaMea", email: process.env.EMAIL_EXPEDITOR?.trim() || "noreply@cheiamea.ro" },
      to: catre.map((email) => ({ email })),
      subject: `Eroare pe CheiaMea: ${unde}`,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => console.error("Raport eroare: Brevo nu răspunde", err));
}
