import "server-only";
import { FIRMA } from "./firma";

// Emailurile trimise de site (parolă uitată, alerte pentru căutări), prin Brevo: 300 de emailuri pe zi gratuit.
// Fără BREVO_API_KEY nu se trimite nimic, iar funcția întoarce false.

export const emailConfigurat = () => !!process.env.BREVO_API_KEY;

export const adresaSite = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro").replace(/\/$/, "");

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export type Email = {
  catre: string;
  subiect: string;
  /** Paragrafele mesajului, text simplu. */
  paragrafe: string[];
  /** Butonul principal. */
  buton?: { text: string; link: string };
  /** Rânduri mici sub semnătură (ex. cum oprești alertele). */
  subsol?: string;
  /** Unde ajunge „Răspunde” (implicit adresa de contact CheiaMea). */
  raspunsLa?: string;
  /** Copie ascunsă (Bcc). */
  copie?: string;
};

function html(e: Email) {
  const p = e.paragrafe.map((t) => `<p style="margin:0 0 14px">${esc(t)}</p>`).join("");
  const b = e.buton
    ? `<p style="margin:22px 0"><a href="${esc(e.buton.link)}" style="background:#F97316;color:#0B2545;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${esc(e.buton.text)}</a></p>`
    : "";
  const s = e.subsol ? `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${esc(e.subsol)}</p>` : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#0F172A;max-width:560px">
<p style="margin:0 0 18px;font-size:20px;font-weight:800;color:#0B2545">Cheia<span style="color:#F97316">Mea</span></p>
${p}${b}
<p style="margin:22px 0 0;color:#6b7280;font-size:13px">Echipa CheiaMea · ${esc(FIRMA.site)}<br>${esc(FIRMA.nume)}, CUI ${esc(FIRMA.cui)}</p>${s}</div>`;
}

function text(e: Email) {
  return [...e.paragrafe, e.buton ? `${e.buton.text}: ${e.buton.link}` : "", "Echipa CheiaMea · " + FIRMA.site, e.subsol ?? ""]
    .filter(Boolean)
    .join("\n\n");
}

export const expeditor = () => process.env.EMAIL_EXPEDITOR?.trim() || "noreply@cheiamea.ro";

/** Cerere către API-ul Brevo (pagina /admin/email); întoarce răspunsul JSON sau eroarea Brevo. */
export async function brevo(metoda: "GET" | "POST" | "PUT", cale: string, corp?: unknown): Promise<{ ok: boolean; date: any }> {
  const cheie = process.env.BREVO_API_KEY?.trim();
  if (!cheie) return { ok: false, date: { message: "lipsește BREVO_API_KEY" } };
  const r = await fetch(`https://api.brevo.com/v3${cale}`, {
    method: metoda,
    headers: { "api-key": cheie, "content-type": "application/json", accept: "application/json" },
    body: corp === undefined ? undefined : JSON.stringify(corp),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  }).catch((e) => ({ ok: false, status: 0, text: async () => JSON.stringify({ message: String(e) }) }) as const);
  const text = await r.text().catch(() => "");
  let date: any = {};
  try {
    date = text ? JSON.parse(text) : {};
  } catch {
    date = { message: text };
  }
  return { ok: r.ok, date };
}

export async function trimiteEmail(e: Email): Promise<boolean> {
  const cheie = process.env.BREVO_API_KEY?.trim();
  if (!cheie) {
    console.warn(`Email netrimis (lipsește BREVO_API_KEY): „${e.subiect}”`);
    return false;
  }
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": cheie, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "CheiaMea", email: expeditor() },
      replyTo: { email: e.raspunsLa || FIRMA.email },
      to: [{ email: e.catre }],
      ...(e.copie && e.copie.toLowerCase() !== e.catre.toLowerCase() ? { bcc: [{ email: e.copie }] } : {}),
      subject: e.subiect,
      htmlContent: html(e),
      textContent: text(e),
    }),
  }).catch((err) => {
    console.error("Email: Brevo nu răspunde", err);
    return null;
  });
  if (!r?.ok) {
    if (r) console.error(`Email: Brevo a refuzat (${r.status})`, await r.text().catch(() => ""));
    return false;
  }
  return true;
}
