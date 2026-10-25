import "server-only";

// Client minimal pentru API-ul Oblio (https://www.oblio.eu/api).
// Oblio ține seria și numerotarea continuă și trimite facturile în e-Factura (SPV).

const API = "https://www.oblio.eu/api";

let token: { valoare: string; expiraLa: number } | null = null;

export function oblioConfigurat() {
  return !!(process.env.OBLIO_EMAIL && process.env.OBLIO_SECRET && process.env.FACTURARE_CIF);
}

async function obtineToken() {
  if (token && token.expiraLa > Date.now() + 60_000) return token.valoare;
  const r = await fetch(`${API}/authorize/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.OBLIO_EMAIL!, client_secret: process.env.OBLIO_SECRET! }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Oblio: autentificare eșuată (${r.status})`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  token = { valoare: j.access_token, expiraLa: Date.now() + Number(j.expires_in) * 1000 };
  return token.valoare;
}

async function cerere<T>(metoda: "GET" | "POST" | "PUT", cale: string, corp: Record<string, unknown>): Promise<T> {
  const date = { cif: process.env.FACTURARE_CIF, ...corp };
  const url = metoda === "GET" ? `${API}${cale}?${new URLSearchParams(Object.entries(date).map(([k, v]) => [k, String(v ?? "")]))}` : `${API}${cale}`;
  const r = await fetch(url, {
    method: metoda,
    headers: { Authorization: `Bearer ${await obtineToken()}`, "Content-Type": "application/json" },
    body: metoda === "GET" ? undefined : JSON.stringify(date),
    cache: "no-store",
  });
  const j = (await r.json().catch(() => ({}))) as { status?: number; statusMessage?: string; data?: T };
  if (!r.ok || j.status !== 200) throw new Error(`Oblio: ${j.statusMessage ?? `eroare ${r.status}`}`);
  return j.data as T;
}

export type ClientOblio = {
  name: string;
  cif?: string;
  rc?: string;
  address?: string;
  state?: string;
  city?: string;
  country?: string;
  email?: string;
};

export type ProdusOblio = {
  name: string;
  price: number;
  quantity: number;
  measuringUnit: string;
  productType: string;
  vatIncluded: 1;
  vatName?: string;
  vatPercentage?: number;
};

type DocEmis = { seriesName: string; number: string; link: string };

export function emiteFacturaOblio(f: {
  client: ClientOblio;
  products: ProdusOblio[];
  mentions?: string;
  plataRef?: string;
}) {
  return cerere<DocEmis>("POST", "/docs/invoice", {
    client: f.client,
    seriesName: process.env.FACTURARE_SERIE ?? "CHM",
    language: "RO",
    currency: "RON",
    products: f.products,
    mentions: f.mentions,
    // Plata e deja încasată cu cardul prin Netopia.
    ...(f.plataRef && { collect: { type: "Card", documentNumber: f.plataRef } }),
    sendEmail: f.client.email ? 1 : 0,
  });
}

/** Storno total al unei facturi (factură nouă, cu minus, legată de cea inițială). */
export function stornoOblio(f: { client: ClientOblio; seriesName: string; number: string }) {
  return cerere<DocEmis>("POST", "/docs/invoice", {
    client: f.client,
    seriesName: f.seriesName,
    referenceDocument: { type: "Factura", seriesName: f.seriesName, number: f.number, refund: 1 },
  });
}

/** Trimite (sau retrimite) factura în SPV și întoarce starea: -1 netrimisă, 0 în prelucrare, 1 trimisă, 2 erori. */
export async function eFacturaOblio(seriesName: string, number: string) {
  const d = await cerere<{ code?: number | string }>("POST", "/docs/einvoice", { seriesName, number });
  return Number(d?.code ?? 0);
}

/** Doar citește starea din SPV (fără să trimită nimic): -1 netrimisă, 0 în prelucrare, 1 trimisă, 2 erori; null dacă Oblio nu știe. */
export async function stareEFacturaOblio(seriesName: string, number: string) {
  const d = await cerere<{ einvoiceStatus?: { code?: number | string } }[]>("GET", "/docs/invoice/list", { seriesName, number, withEinvoiceStatus: 1 });
  const cod = d?.[0]?.einvoiceStatus?.code;
  return cod === undefined || cod === null ? null : Number(cod);
}
