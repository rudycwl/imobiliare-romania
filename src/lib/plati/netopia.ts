import "server-only";
import { createHash, createPublicKey, createVerify } from "crypto";

// NETOPIA Payments, API v2 (cheie API). Variabile în Netlify:
// NETOPIA_API_KEY, NETOPIA_POS_SIGNATURE, NETOPIA_PUBLIC_KEY (cheia publică a punctului de vânzare, PEM sau base64),
// NETOPIA_LIVE=da doar după aprobarea punctului de vânzare; altfel se folosește sandbox-ul.

const LIVE = process.env.NETOPIA_LIVE === "da";
const BAZA = process.env.NETOPIA_URL ?? (LIVE ? "https://secure.mobilpay.ro/pay" : "https://secure.sandbox.netopia-payments.com");

export const netopiaConfigurat = () => !!(process.env.NETOPIA_API_KEY && process.env.NETOPIA_POS_SIGNATURE);
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
      posSignature: process.env.NETOPIA_POS_SIGNATURE,
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
    headers: { "Content-Type": "application/json", Authorization: process.env.NETOPIA_API_KEY ?? "" },
    body: JSON.stringify(corp),
    signal: AbortSignal.timeout(15000),
  });
  const j = (await r.json().catch(() => null)) as { payment?: { paymentURL?: string; ntpID?: string }; error?: { code?: string; message?: string } } | null;
  // Codul 101 = clientul trebuie trimis pe pagina de plată NETOPIA (cazul normal fără datele cardului la noi).
  const url = j?.payment?.paymentURL;
  if (!url) throw new Error(`NETOPIA: ${j?.error?.code ?? r.status} ${j?.error?.message ?? "răspuns fără paymentURL"}`);
  return { url, ntpID: j?.payment?.ntpID ?? null };
}

function cheiePublica() {
  const v = process.env.NETOPIA_PUBLIC_KEY?.trim();
  if (!v) return null;
  const pem = v.startsWith("-----") ? v : Buffer.from(v, "base64").toString("utf8");
  return createPublicKey(pem.replace(/\\n/g, "\n"));
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/**
 * Verifică notificarea (IPN): antetul Verification-token e un JWT semnat RS512 de NETOPIA,
 * cu iss „NETOPIA Payments”, aud = semnătura punctului de vânzare și sub = SHA-512 (base64) al corpului.
 */
export function verificaNotificare(corp: string, token: string | null) {
  const cheie = cheiePublica();
  if (!cheie || !token) return false;
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return false;
  const v = createVerify("RSA-SHA512");
  v.update(`${h}.${p}`);
  if (!v.verify(cheie, b64url(s))) return false;
  const c = JSON.parse(b64url(p).toString("utf8")) as { iss?: string; aud?: string | string[]; sub?: string };
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  const hash = createHash("sha512").update(corp, "utf8").digest("base64");
  return c.iss === "NETOPIA Payments" && aud.includes(process.env.NETOPIA_POS_SIGNATURE) && c.sub === hash;
}

/** 3 = plătită, 5 = confirmată: ambele înseamnă bani încasați. */
export const STARI_PLATITE = [3, 5];
