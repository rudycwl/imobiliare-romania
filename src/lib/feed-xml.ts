import { XMLParser } from "fast-xml-parser";

// Citirea feed-ului XML al unei agenții (exportul din programul agenției, CRM).
// Programele imobiliare din România exportă în formate diferite (românește sau englezește, câmpuri pe primul
// nivel sau grupate în <location>, prețul cu moneda ca atribut etc.). Aici găsim lista de anunțuri din fișier
// și aducem fiecare anunț la forma unui rând de import (aceleași câmpuri ca modelul CSV), plus codul din CRM.
// Verificarea câmpurilor (tip, localitate, preț) rămâne cea de la import: src/lib/import-masa.ts.

export type RandFeed = { externId: string; rand: Record<string, string> };

/** Cheia unui câmp, fără diacritice, majuscule și separatori: „Nr_Camere” → „nrcamere”. */
const norm = (s: string) =>
  s
    .replace(/^@_/, "")
    .replace(/^[a-z0-9]+:/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const SINONIME: Record<string, string[]> = {
  id: ["id", "cod", "code", "ref", "referinta", "reference", "externalid", "listingid", "offerid", "propertyid", "idanunt", "idoferta", "idintern", "codoferta", "codanunt", "uid", "guid"],
  titlu: ["titlu", "title", "name", "denumire", "headline", "titluanunt"],
  descriere: ["descriere", "description", "desc", "detalii", "details", "content", "descrierecompleta"],
  pret: ["pret", "price", "pretvanzare", "saleprice", "rentprice", "pretchirie", "pretlista", "listprice", "amount"],
  moneda: ["moneda", "currency", "valuta", "pretmoneda", "pricecurrency"],
  suprafata: ["suprafatautila", "suputila", "usablearea", "livingarea", "suprafata", "surface", "area", "size", "sqm", "mp", "suprafataconstruita", "suprafatateren", "landarea", "builtarea"],
  camere: ["camere", "nrcamere", "numarcamere", "rooms", "roomsnumber", "nrrooms", "numberofrooms", "bedrooms"],
  tip: ["tipproprietate", "propertytype", "tipimobil", "tip", "type", "categorie", "category"],
  tranzactie: ["tranzactie", "tiptranzactie", "transaction", "transactiontype", "offertype", "tipoferta", "operation", "contract", "scop"],
  judet: ["judet", "county", "region", "regiune"],
  oras: ["oras", "localitate", "city", "town", "locality", "municipiu"],
  zona: ["zona", "cartier", "neighborhood", "neighbourhood", "district", "zone", "quarter", "subzona"],
  lat: ["lat", "latitude", "latitudine"],
  lng: ["lng", "lon", "long", "longitude", "longitudine"],
};
const CONTAINERE_LOC = ["location", "locatie", "localizare", "address", "adresa", "geo", "pozitie", "position"];
const CHEI_POZE = ["poze", "photos", "pictures", "images", "imagini", "gallery", "galerie", "media", "foto", "fotografii", "poza", "photo", "picture", "image", "imagine"];

const index = new Map<string, string>();
for (const [camp, lista] of Object.entries(SINONIME)) for (const s of lista) if (!index.has(s)) index.set(s, camp);

type Nod = Record<string, unknown>;
const esteNod = (v: unknown): v is Nod => !!v && typeof v === "object" && !Array.isArray(v);

/** Textul unui nod: „85000”, { "#text": "85000", "@_currency": "EUR" } sau [ … ] → primul text. */
function text(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.length ? text(v[0]) : "";
  if (esteNod(v)) {
    if ("#text" in v) return text(v["#text"]);
    // <price><value>85000</value><currency>EUR</currency></price>
    for (const k of ["value", "valoare", "amount", "suma"]) for (const [kk, vv] of Object.entries(v)) if (norm(kk) === k) return text(vv);
  }
  return "";
}

/** Câmpurile cunoscute ale unui nod (primul nivel + atributele), după sinonime. */
function campuri(n: Nod): Map<string, unknown> {
  const m = new Map<string, unknown>();
  for (const [k, v] of Object.entries(n)) {
    const c = index.get(norm(k));
    if (c && !m.has(c)) m.set(c, v);
  }
  return m;
}

/** Cât de mult seamănă un nod cu un anunț: câte câmpuri cunoscute are. */
function scor(n: unknown) {
  if (!esteNod(n)) return 0;
  const c = campuri(n);
  return c.size + (c.has("pret") ? 2 : 0);
}

/** Lista de anunțuri din fișier: cea mai lungă listă de noduri care seamănă cu un anunț (cel puțin 3 câmpuri). */
function gasesteLista(rad: unknown): Nod[] {
  let best: Nod[] = [];
  let bestScor = 0;
  const viziteaza = (v: unknown, adancime: number) => {
    if (adancime > 8 || !v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      const noduri = v.filter(esteNod);
      if (noduri.length) {
        const mediu = noduri.slice(0, 20).reduce((s, n) => s + scor(n), 0) / Math.min(noduri.length, 20);
        const total = mediu >= 3 ? noduri.length * mediu : 0;
        if (total > bestScor) {
          bestScor = total;
          best = noduri;
        }
      }
      for (const x of v.slice(0, 3)) viziteaza(x, adancime + 1);
      return;
    }
    for (const x of Object.values(v)) {
      // Un singur anunț în fișier nu vine ca listă: îl tratăm ca listă de 1.
      if (esteNod(x) && scor(x) >= 4 && bestScor < scor(x)) {
        bestScor = scor(x);
        best = [x];
      }
      viziteaza(x, adancime + 1);
    }
  };
  viziteaza(rad, 0);
  return best;
}

/** Toate linkurile https:// dintr-un nod (pozele pot veni ca text, atribut url, listă de <image> etc.). */
function linkuri(v: unknown, out: string[] = [], adancime = 0): string[] {
  if (adancime > 5 || out.length >= 30) return out;
  if (typeof v === "string") {
    for (const u of v.split(/[\s|,;]+/)) if (/^https:\/\/\S+$/i.test(u) && !out.includes(u)) out.push(u);
  } else if (Array.isArray(v)) for (const x of v) linkuri(x, out, adancime + 1);
  else if (esteNod(v)) for (const x of Object.values(v)) linkuri(x, out, adancime + 1);
  return out;
}

const TIP: [RegExp, string][] = [
  [/garsonier|studio|apart|flat|condo|bloc/, "apartament"],
  [/birou|office/, "birouri"],
  [/depozit|hala|warehouse|industrial|logistic/, "depozit"],
  [/teren|land|plot|lot/, "teren"],
  [/comercial|commercial|retail|shop|magazin|spatiu/, "spatiu-comercial"],
  [/casa|vila|villa|house|home|duplex|cabana/, "casa"],
];
const TRANZ: [RegExp, string][] = [
  [/inchir|chiri|rent|lease|letting/, "inchiriere"],
  [/vanz|vand|vind|sale|sell|buy|cumpar/, "vanzare"],
];
const potrivire = (v: string, l: [RegExp, string][]) => {
  const s = norm(v);
  return l.find(([r]) => r.test(s))?.[1] ?? v;
};

/** „85.000”, „85,000”, „85000.00”, „85 000 €” → 85000; „54,5” → 54.5. */
export function numarFeed(v: string): number | null {
  let s = v.replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const zec = s.match(/[.,](\d{1,2})$/);
  if (zec && !/[.,]\d{3}$/.test(s)) s = s.slice(0, -zec[0].length).replace(/[.,]/g, "") + "." + zec[1];
  else s = s.replace(/[.,]/g, "");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Un anunț din feed → rând de import + codul din CRM. cursEuro: lei pentru 1 € (prețurile în lei se convertesc). */
export function randDinNod(n: Nod, cursEuro: number | null): RandFeed | { eroare: string; externId: string } {
  const c = campuri(n);
  // Câmpurile de localizare pot fi grupate: <location><city>…</city><zone>…</zone></location>.
  for (const [k, v] of Object.entries(n)) {
    if (!CONTAINERE_LOC.includes(norm(k)) || !esteNod(v)) continue;
    for (const [kk, vv] of campuri(v)) if (!c.has(kk) || !text(c.get(kk))) c.set(kk, vv);
  }
  const externId = text(c.get("id")).slice(0, 100);
  if (!externId) return { eroare: "anunțul nu are cod (id) în feed", externId: "" };

  const pretNod = c.get("pret");
  const moneda = (text(c.get("moneda")) || (esteNod(pretNod) ? text(pretNod["@_currency"] ?? pretNod["@_moneda"] ?? pretNod["currency"]) : "")).toUpperCase();
  let pret = numarFeed(text(pretNod));
  if (pret && /RON|LEI/.test(moneda)) {
    if (!cursEuro) return { eroare: "prețul e în lei și cursul euro nu e disponibil acum", externId };
    pret = pret / cursEuro;
  } else if (moneda && !/EUR|€/.test(moneda)) return { eroare: `moneda „${moneda}” nu e acceptată (doar EUR sau RON)`, externId };

  const tipText = text(c.get("tip"));
  const titlu = text(c.get("titlu"));
  let camere = numarFeed(text(c.get("camere")));
  if (!camere && /garsonier|studio/.test(norm(tipText + " " + titlu))) camere = 1;
  const sup = numarFeed(text(c.get("suprafata")));
  const pozeNod = Object.entries(n).find(([k]) => CHEI_POZE.includes(norm(k)))?.[1];

  const rand: Record<string, string> = {
    titlu,
    descriere: text(c.get("descriere")).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").trim(),
    tip: potrivire(tipText || titlu, TIP),
    tranzactie: potrivire(text(c.get("tranzactie")) || titlu, TRANZ),
    pret: pret ? String(Math.round(pret)) : "",
    suprafata: sup ? String(Math.round(sup)) : "",
    camere: camere ? String(Math.round(camere)) : "",
    judet: text(c.get("judet")),
    oras: text(c.get("oras")),
    zona: text(c.get("zona")),
    poze: linkuri(pozeNod).join(" "),
  };
  return { externId, rand };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  cdataPropName: false,
});

export type FeedCitit = { anunturi: (RandFeed | { eroare: string; externId: string })[] };

/** Citește feed-ul; aruncă o eroare pe înțelesul agenției dacă fișierul nu e XML sau nu are anunțuri. */
export function citesteFeed(xml: string, cursEuro: number | null): FeedCitit {
  let rad: unknown;
  try {
    rad = parser.parse(xml);
  } catch {
    throw new Error("Fișierul de la adresa feed-ului nu e XML valid.");
  }
  const lista = gasesteLista(rad);
  if (!lista.length) throw new Error("Nu am găsit anunțuri în feed (fiecare anunț trebuie să aibă cel puțin cod, titlu sau preț și localitate).");
  return { anunturi: lista.map((n) => randDinNod(n, cursEuro)) };
}
