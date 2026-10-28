import { JUDETE } from "@/modules/judete";
import { slugify } from "@/lib/etichete";

/** Site-urile de pe care proprietarul își poate importa propriul anunț. Doar acestea: nu cerem URL-uri arbitrare. */
export const SITE_IMPORT = ["olx.ro", "storia.ro", "imobiliare.ro", "publi24.ro", "lajumate.ro"];

export type AnuntImportat = Partial<{
  titlu: string;
  descriere: string;
  pret: string;
  suprafata: string;
  camere: string;
  tip: string;
  tranzactie: string;
  judet: string;
  oras: string;
}>;

export function urlPermis(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  return SITE_IMPORT.some((s) => host === s || host.endsWith("." + s)) ? u : null;
}

const entitati: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const decodeaza = (s: string) =>
  s
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e) => entitati[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const faraTaguri = (s: string) => decodeaza(s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/\n{3,}/g, "\n\n").trim();

function meta(html: string, nume: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${nume}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const c = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return c ? decodeaza(c).trim() : undefined;
}

/** Toate obiectele din blocurile JSON-LD, aplatizate (inclusiv @graph). */
function jsonLd(html: string): Record<string, unknown>[] {
  const rez: Record<string, unknown>[] = [];
  const add = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(add);
    else if (o && typeof o === "object") {
      rez.push(o as Record<string, unknown>);
      const g = (o as Record<string, unknown>)["@graph"];
      if (g) add(g);
    }
  };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      add(JSON.parse(m[1]));
    } catch {
      /* bloc invalid: îl ignorăm */
    }
  }
  return rez;
}

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : undefined);

function gasesteOras(text: string): { judet: string; oras?: string } | undefined {
  const t = ` ${slugify(text)} `.replace(/-/g, " ");
  // Orașele cu nume mai lung întâi, ca „Baia Mare” să nu fie confundat cu altceva mai scurt.
  const toate = JUDETE.flatMap((j) => j.orase.map((o) => ({ judet: j.slug, oras: o.slug, cheie: ` ${slugify(o.nume).replace(/-/g, " ")} ` })));
  toate.sort((a, b) => b.cheie.length - a.cheie.length);
  const g = toate.find((o) => t.includes(o.cheie));
  if (g) return { judet: g.judet, oras: g.oras };
  // Doar județul (ex. „București”, unde orașele sunt sectoare): omul alege restul.
  const j = JUDETE.find((j) => t.includes(` ${slugify(j.nume).replace(/-/g, " ")} `));
  return j && { judet: j.slug };
}

/** Numele site-ului de import, pentru mesaje („OLX”, „Storia” …). */
export function numeSite(url: URL): string {
  const h = url.hostname.toLowerCase();
  const s = SITE_IMPORT.find((x) => h === x || h.endsWith("." + x)) ?? h;
  return ({ "olx.ro": "OLX", "storia.ro": "Storia", "imobiliare.ro": "imobiliare.ro", "publi24.ro": "Publi24", "lajumate.ro": "LaJumate" } as Record<string, string>)[s] ?? s;
}

/**
 * Anunț inactiv, expirat sau șters: site-ul răspunde 404/410, ne trimite pe prima pagină
 * (OLX face așa la anunțurile inactive) sau scrie pe pagină că anunțul nu mai e disponibil.
 */
export function anuntIndisponibil(html: string, cerut: URL, final: URL, status = 200): boolean {
  if (status === 404 || status === 410) return true;
  const cale = final.pathname.replace(/\/+$/, "");
  if (cale === "" && cerut.pathname.replace(/\/+$/, "") !== "") return true;
  const titlu = decodeaza(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  if (/anun[tț]uri gratuite\s*-\s*peste/i.test(titlu)) return true;
  if (jsonLd(html).some((o) => /Product|Offer|Residence|Apartment|House|RealEstateListing/i.test(String(o["@type"])))) return false;
  return /anun[tțţ](ul)? (nu mai este (disponibil|activ)|a fost (șters|sters|dezactivat|retras))|anun[tțţ] (inactiv|expirat|dezactivat)/i.test(faraTaguri(html).slice(0, 200_000));
}

/** Extrage câmpurile anunțului din HTML-ul paginii (JSON-LD, Open Graph și text). Ce nu găsește rămâne gol. */
export function extrageAnunt(html: string, url: URL): AnuntImportat {
  const r: AnuntImportat = {};
  const ld = jsonLd(html);
  const produs = ld.find((o) => /Product|Offer|Residence|Apartment|House|RealEstateListing|SingleFamilyResidence/i.test(String(o["@type"])));

  r.titlu = str(produs?.name) ?? meta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (r.titlu) r.titlu = decodeaza(r.titlu).replace(/\s*[-|•]\s*(OLX|Storia|imobiliare\.ro|Publi24|LaJumate).*$/i, "").trim().slice(0, 120);
  const desc = str(produs?.description) ?? meta(html, "og:description") ?? meta(html, "description");
  if (desc) r.descriere = faraTaguri(desc).slice(0, 5000);

  const oferta = (Array.isArray(produs?.offers) ? produs?.offers[0] : produs?.offers) as Record<string, unknown> | undefined;
  const pretLd = str(oferta?.price) ?? meta(html, "product:price:amount") ?? meta(html, "og:price:amount");
  const moneda = (str(oferta?.priceCurrency) ?? meta(html, "product:price:currency") ?? "EUR").toUpperCase();
  if (pretLd && moneda === "EUR") r.pret = String(Math.round(Number(pretLd.replace(/[^\d.]/g, ""))) || "");
  if (!r.pret) {
    const m = (r.titlu + " " + (r.descriere ?? "")).match(/(\d{1,3}(?:[.\s]\d{3})+|\d{3,7})\s*(?:€|eur)/i);
    if (m) r.pret = m[1].replace(/[.\s]/g, "");
  }

  const text = `${r.titlu ?? ""}\n${r.descriere ?? ""}`;
  const mp = text.match(/(\d{2,5}(?:[.,]\d+)?)\s*(?:m²|mp|m2|metri p)/i);
  if (mp) r.suprafata = String(Math.round(Number(mp[1].replace(",", "."))));
  const cam = text.match(/(\d{1,2})\s*(?:camere|cam\.)/i);
  if (cam) r.camere = cam[1];
  else if (/garsonier/i.test(text)) r.camere = "1";

  const t = slugify(text + " " + url.pathname);
  r.tip = /teren/.test(t) ? "teren" : /\b(casa|case|vila)\b|casa-|vila-/.test(t) ? "casa" : /birou/.test(t) ? "birouri" : /depozit|hala|hale/.test(t) ? "depozit" : /spatiu|comercial/.test(t) ? "spatiu-comercial" : "apartament";
  r.tranzactie = /inchiri|chirie|de-inchiriat/.test(t) ? "inchiriere" : "vanzare";

  const adresa = produs?.address as Record<string, unknown> | undefined;
  const loc = gasesteOras([str(adresa?.addressLocality), str(adresa?.addressRegion), r.titlu, url.pathname.replace(/[-/]/g, " ")].filter(Boolean).join(" "));
  if (loc) Object.assign(r, loc);

  return Object.fromEntries(Object.entries(r).filter(([, v]) => v)) as AnuntImportat;
}
