import "server-only";
import { createHash, createPublicKey, createVerify, X509Certificate } from "crypto";

// NETOPIA Payments, API v2 (cheie API). Variabile în Netlify:
// NETOPIA_API_KEY, NETOPIA_POS_SIGNATURE, NETOPIA_PUBLIC_KEY (cheia publică a punctului de vânzare, PEM sau base64),
// NETOPIA_LIVE=da doar după aprobarea punctului de vânzare; altfel se folosește sandbox-ul.

const LIVE = process.env.NETOPIA_LIVE === "da";
const BAZA = process.env.NETOPIA_URL ?? (LIVE ? "https://secure.mobilpay.ro/pay" : "https://secure.sandbox.netopia-payments.com");

// În modul de test se folosesc cheile NETOPIA_SANDBOX_* dacă există, ca cele LIVE să poată sta puse în paralel
// (NETOPIA testează implementarea în sandbox înainte de aprobare; după aprobare se scrie doar NETOPIA_LIVE=da).
const alege = (nume: string) => (!LIVE && process.env[`NETOPIA_SANDBOX_${nume}`]) || process.env[`NETOPIA_${nume}`];
const cheieApi = () => alege("API_KEY") ?? "";
const semnaturaPos = () => alege("POS_SIGNATURE") ?? "";

export const netopiaConfigurat = () => !!(cheieApi() && semnaturaPos());
export const modTest = () => !LIVE;

export type Facturare = {
  email: string;
  telefon: string;
  prenume: string;
  nume: string;
  oras: string;
  judet: string;
  codPostal: string;
  adresa: string;
};

export type ProdusPlata = { nume: string; cod: string; pretBani: number };

/** Pornește plata și întoarce adresa paginii NETOPIA unde e trimis clientul. */
export async function pornestePlata(p: {
  comandaId: string;
  descriere: string;
  sumaBani: number;
  facturare: Facturare;
  produse: ProdusPlata[];
  notifyUrl: string;
  redirectUrl: string;
}) {
  const corp = {
    config: { notifyUrl: p.notifyUrl, redirectUrl: p.redirectUrl, language: "ro", emailTemplate: "" },
    payment: { options: { installments: 0, bonus: 0 }, data: {} },
    order: {
      ntpID: "",
      posSignature: semnaturaPos(),
      dateTime: new Date().toISOString(),
      description: p.descriere,
      orderID: p.comandaId,
      amount: p.sumaBani / 100,
      currency: "RON",
      billing: {
        email: p.facturare.email,
        phone: p.facturare.telefon,
        firstName: p.facturare.prenume,
        lastName: p.facturare.nume,
        city: p.facturare.oras,
        country: 642,
        countryName: "Romania",
        state: p.facturare.judet,
        postalCode: p.facturare.codPostal,
        details: p.facturare.adresa,
      },
      products: p.produse.map((x) => ({ name: x.nume, code: x.cod, category: "Servicii publicitate", price: x.pretBani / 100, vat: 0 })),
      installments: { selected: 0, available: [0] },
      data: {},
    },
  };
  const r = await fetch(`${BAZA}/payment/card/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: cheieApi() },
    body: JSON.stringify(corp),
    signal: AbortSignal.timeout(15000),
  });
  const j = (await r.json().catch(() => null)) as { payment?: { paymentURL?: string; ntpID?: string }; error?: { code?: string; message?: string } } | null;
  // Codul 101 = clientul trebuie trimis pe pagina de plată NETOPIA (cazul normal fără datele cardului la noi).
  const url = j?.payment?.paymentURL;
  if (!url) throw new Error(`NETOPIA: ${j?.error?.code ?? r.status} ${j?.error?.message ?? "răspuns fără paymentURL"}`);
  return { url, ntpID: j?.payment?.ntpID ?? null };
}

/** Reface un PEM lipit pe un singur rând (spațiile în loc de rânduri noi îl fac ilizibil pentru OpenSSL). */
function refaPem(text: string) {
  const m = text.replace(/\\n/g, "\n").match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  if (!m) return null;
  const corp = m[2].replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN ${m[1]}-----\n${corp}\n-----END ${m[1]}-----\n`;
}

/**
 * Cheia publică NETOPIA, oricum a fost lipită în Netlify: PEM (certificat .cer sau cheie publică),
 * PEM pe un singur rând, PEM codat base64 sau direct conținutul DER în base64.
 */
function cheiePublica() {
  const v = alege("PUBLIC_KEY")?.trim();
  if (!v) return null;
  const pem = refaPem(v) ?? refaPem(Buffer.from(v, "base64").toString("utf8"));
  if (pem) return createPublicKey(pem);
  const der = Buffer.from(v.replace(/\s+/g, ""), "base64");
  try {
    return createPublicKey({ key: der, format: "der", type: "spki" });
  } catch {
    return new X509Certificate(der).publicKey;
  }
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/**
 * Verifică notificarea (IPN): antetul Verification-token e un JWT semnat RS512 de NETOPIA,
 * cu iss „NETOPIA Payments”, aud = semnătura punctului de vânzare și sub = SHA-512 (base64) al corpului.
 */
export function verificaNotificare(corp: string, token: string | null) {
  const cheie = cheiePublica();
  if (!cheie || !token) {
    console.error("IPN NETOPIA:", !cheie ? "lipsește NETOPIA_PUBLIC_KEY" : "lipsește Verification-token");
    return false;
  }
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) {
    console.error("IPN NETOPIA: Verification-token nu e JWT");
    return false;
  }
  let c: { iss?: string; aud?: string | string[]; sub?: string }, alg: string | undefined;
  try {
    c = JSON.parse(b64url(p).toString("utf8"));
    alg = JSON.parse(b64url(h).toString("utf8")).alg;
  } catch {
    console.error("IPN NETOPIA: Verification-token ilizibil");
    return false;
  }
  const v = createVerify("RSA-SHA512");
  v.update(`${h}.${p}`);
  const semnatura = v.verify(cheie, b64url(s));
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  const hash = createHash("sha512").update(corp, "utf8").digest("base64");
  const verificari = {
    alg,
    semnatura,
    iss: c.iss === "NETOPIA Payments",
    aud: aud.includes(semnaturaPos()),
    sub: c.sub === hash,
  };
  const ok = semnatura && verificari.iss && verificari.aud && verificari.sub;
  // Doar rezultate da/nu, fără chei sau date ale clientului, ca să vedem în jurnal ce verificare a picat.
  if (!ok) console.error("IPN NETOPIA: verificare picată", JSON.stringify(verificari));
  return ok;
}

/**
 * Întreabă direct NETOPIA (server la server, cu cheia API secretă) starea unei plăți.
 * Sursa de adevăr când notificarea nu poate fi verificată sau întârzie.
 */
export async function stareaPlatii(orderID: string, ntpID: string | null) {
  if (!netopiaConfigurat()) return null;
  try {
    const r = await fetch(`${BAZA}/operation/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: cheieApi() },
      body: JSON.stringify({ posID: semnaturaPos(), ntpID: ntpID ?? "", orderID }),
      signal: AbortSignal.timeout(10000),
    });
    const j = (await r.json().catch(() => null)) as { payment?: { status?: number; amount?: number; ntpID?: string }; error?: { code?: string } } | null;
    if (!j?.payment || j.payment.status === undefined) {
      console.error("NETOPIA operation/status:", r.status, j?.error?.code ?? "fără payment");
      return null;
    }
    return { status: Number(j.payment.status), sumaBani: Math.round(Number(j.payment.amount) * 100), ntpID: j.payment.ntpID ?? ntpID };
  } catch (e) {
    console.error("NETOPIA operation/status:", (e as Error).message);
    return null;
  }
}

/** 3 = plătită, 5 = confirmată: ambele înseamnă bani încasați. */
export const STARI_PLATITE = [3, 5];
