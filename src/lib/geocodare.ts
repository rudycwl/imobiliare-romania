import "server-only";
import { db } from "./db";
import { getJudet, getOras } from "./geo";
import { distantaM } from "./locatie";

export type Punct = { lat: number; lng: number };

// Nominatim (OpenStreetMap) e gratuit, dar cere cel mult o cerere pe secundă și un User-Agent cu contact.
// https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const AGENT = "CheiaMea/1.0 (https://cheiamea.ro; contact@cheiamea.ro)";

const cache = new Map<string, Punct | null>();
let coada: Promise<unknown> = Promise.resolve();

/** Cererile către Nominatim trec pe rând, la cel puțin 1,1 secunde una de alta. */
function laRand<T>(f: () => Promise<T>): Promise<T> {
  const r = coada.then(f, f);
  coada = r.then(
    () => new Promise((ok) => setTimeout(ok, 1100)),
    () => new Promise((ok) => setTimeout(ok, 1100)),
  );
  return r;
}

async function cauta(text: string, parametri?: Record<string, string>): Promise<Punct | null> {
  const cheie = parametri ? JSON.stringify(parametri).toLowerCase() : text.toLowerCase();
  if (cache.has(cheie)) return cache.get(cheie)!;
  const r = await laRand(async () => {
    try {
      const q = parametri ? new URLSearchParams(parametri).toString() : `q=${encodeURIComponent(text)}`;
      const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=ro&accept-language=ro&${q}`;
      const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return undefined;
      const [p] = (await res.json()) as { lat: string; lon: string }[];
      return p ? { lat: Number(p.lat), lng: Number(p.lon) } : null;
    } catch {
      return undefined;
    }
  });
  // Erorile de rețea (undefined) nu se țin minte, ca să se reîncerce data viitoare.
  if (r !== undefined) cache.set(cheie, r);
  return r ?? null;
}

// Atenție: Nominatim nu găsește nimic când textul conține „județul X” (ex. „Iași, județul Iași” → []).
// Localitatea se caută structurat (oraș + județ), zona ca „Zonă, Oraș”.

/** Centrul localității (în București: al sectorului). */
async function centruLocalitate(judet: string, oras: string): Promise<Punct | null> {
  const j = getJudet(judet)?.nume;
  const o = getOras(judet, oras)?.nume;
  if (!j || !o) return null;
  if (judet === "bucuresti") return (await cauta(`${o}, București`)) || (await cauta("București"));
  return (await cauta("", { city: o, county: j })) || (await cauta(`${o}, ${j}`));
}

/** Centrul cartierului (sau, dacă nu-l găsește în localitate, al localității) după numele din anunț. */
export async function gasesteZona(zona: string, judet: string, oras: string): Promise<Punct | null> {
  const o = getOras(judet, oras)?.nume;
  if (!o) return null;
  const centru = await centruLocalitate(judet, oras);
  const z = zona.trim();
  if (z && slug(z) !== slug(o)) {
    const p = await cauta(`${z}, ${judet === "bucuresti" ? "București" : o}`);
    if (p && (!centru || distantaM(p, centru) <= MAX_KM_DE_LOCALITATE * 1000)) return p;
  }
  return centru;
}

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Distanța maximă (km) dintre adresa găsită și centrul localității: altfel e altă stradă cu același nume. */
const MAX_KM_DE_LOCALITATE = 25;

/** Un rezultat Nominatim cu adresa detaliată (addressdetails=1). */
export type RezultatAdresa = { lat: string; lon: string; address?: Record<string, string | undefined> };

/** Câmpurile în care Nominatim pune localitatea (oraș, comună, sat). */
const CAMPURI_LOCALITATE = ["city", "town", "village", "municipality"] as const;

/**
 * Rezultatul e chiar în localitatea aleasă? Rudy 17.11.2026: „Strada Vasile Alecsandri 3, Iași” cădea în Balciu
 * (com. Miroslava), iar „Strada Lăpușneanu 10, Iași” în Podu Iloaiei – străzi cu același nume, sub 25 km de Iași.
 * Comparăm numele (fără diacritice, litere mici) cu city / town / village / municipality; în București ajunge orașul.
 */
export function inLocalitate(r: RezultatAdresa, oras: string, bucuresti = false): boolean {
  const a = r.address;
  if (!a) return false;
  const tinta = slug(bucuresti ? "București" : oras);
  return CAMPURI_LOCALITATE.some((k) => a[k] && slug(a[k]!) === tinta);
}

const TIPURI_STRADA = /^(strada|str|bulevardul|bulevard|bd|bdul|blvd|calea|soseaua|sos|aleea|al|piata|pta|intrarea|intr|splaiul|drumul|fundatura|ulita)$/;
const cuvinte = (s: string) => slug(s).split(/[^a-z0-9]+/).filter((w) => w && !TIPURI_STRADA.test(w));

/**
 * Strada găsită e cea cerută? Căutarea în text liber întoarce uneori altă stradă din oraș („Strada Balciu, Iași” →
 * „Strada Văleni”). Toate cuvintele scrise (fără „Strada”, „Bd.” …) trebuie să apară în numele găsit;
 * „Lăpușneanu” se potrivește cu „Strada Alexandru Lăpușneanu”.
 */
export function stradaPotrivita(gasita: string | undefined, ceruta: string): boolean {
  const c = cuvinte(ceruta);
  if (!c.length) return true;
  const g = new Set(cuvinte(gasita ?? ""));
  return c.every((w) => g.has(w));
}

/**
 * Primul rezultat din localitatea aleasă (și, dacă se dă `strada`, de pe strada cerută);
 * `exact` doar dacă Nominatim a găsit chiar numărul cerut.
 */
export function alegeAdresa(rezultate: RezultatAdresa[], oras: string, numar: string, bucuresti = false, strada?: string): (Punct & { exact: boolean }) | null {
  const r = rezultate.find((x) => inLocalitate(x, oras, bucuresti) && (strada === undefined || stradaPotrivita(x.address?.road ?? x.address?.pedestrian, strada)));
  if (!r) return null;
  const nr = numar.trim().toLowerCase();
  return { lat: Number(r.lat), lng: Number(r.lon), exact: !!nr && (r.address?.house_number ?? "").toLowerCase() === nr };
}

const cacheAdrese = new Map<string, RezultatAdresa[]>();

/** Căutare cu adresa detaliată (până la 5 rezultate), ca să putem verifica localitatea fiecăruia. */
async function cautaAdrese(text: string, parametri?: Record<string, string>): Promise<RezultatAdresa[]> {
  const cheie = parametri ? JSON.stringify(parametri).toLowerCase() : text.toLowerCase();
  if (cacheAdrese.has(cheie)) return cacheAdrese.get(cheie)!;
  const r = await laRand(async () => {
    try {
      const q = parametri ? new URLSearchParams(parametri).toString() : `q=${encodeURIComponent(text)}`;
      const url = `${NOMINATIM}?format=jsonv2&limit=5&addressdetails=1&countrycodes=ro&accept-language=ro&${q}`;
      const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return undefined;
      return (await res.json()) as RezultatAdresa[];
    } catch {
      return undefined;
    }
  });
  if (r !== undefined) cacheAdrese.set(cheie, r);
  return r ?? [];
}

/**
 * Adresa (stradă și număr) în localitatea aleasă: căutare structurată în Nominatim (România, localitatea, județul),
 * apoi text liber, apoi doar strada. Se acceptă numai rezultate din localitatea aleasă (inLocalitate) și
 * la cel mult 25 km de centrul ei; altfel null (formularul cere mutarea pinului de mână).
 */
export async function gasesteAdresa(strada: string, numar: string, judet: string, oras: string): Promise<(Punct & { exact: boolean }) | null> {
  const j = getJudet(judet)?.nume;
  const o = getOras(judet, oras)?.nume;
  const st = strada.trim();
  if (!j || !o || st.length < 3) return null;
  const nr = numar.trim();
  const bucuresti = judet === "bucuresti";
  const centru = await centruLocalitate(judet, oras);
  const bun = (p: (Punct & { exact: boolean }) | null) => (p && (!centru || distantaM(p, centru) <= MAX_KM_DE_LOCALITATE * 1000) ? p : null);
  const loc: Record<string, string> = bucuresti ? { city: "București" } : { city: o, county: j };
  const structurat = bun(alegeAdresa(await cautaAdrese("", { street: `${nr ? `${nr} ` : ""}${st}`, ...loc }), o, nr, bucuresti, st));
  if (structurat) return structurat;
  const liber = bun(alegeAdresa(await cautaAdrese(`${st}${nr ? ` ${nr}` : ""}, ${bucuresti ? `${o}, București` : o}`), o, nr, bucuresti, st));
  if (liber) return liber;
  // Numărul nu există în OpenStreetMap: măcar strada.
  if (nr) return bun(alegeAdresa(await cautaAdrese("", { street: st, ...loc }), o, "", bucuresti, st));
  return null;
}

const cacheInvers = new Map<string, { strada: string; numar: string } | null>();

/** Strada și numărul de la un punct de pe hartă (geocodare inversă), pentru a completa formularul. */
export async function adresaLaPunct(lat: number, lng: number): Promise<{ strada: string; numar: string } | null> {
  const cheie = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (cacheInvers.has(cheie)) return cacheInvers.get(cheie)!;
  const r = await laRand(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=ro&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return undefined;
      const j = (await res.json()) as { address?: { road?: string; pedestrian?: string; house_number?: string; country_code?: string } };
      const a = j.address;
      if (!a || a.country_code !== "ro") return null;
      const strada = a.road ?? a.pedestrian ?? "";
      return strada ? { strada, numar: a.house_number ?? "" } : null;
    } catch {
      return undefined;
    }
  });
  if (r !== undefined) cacheInvers.set(cheie, r);
  return r ?? null;
}

const esuate = new Set<number>();
let ruleaza = false;

/** Pune pe hartă anunțurile fără coordonate (câteva odată). Se apelează în fundal, după răspuns. */
export async function completeazaCoordonate(maxim = 15) {
  if (ruleaza) return;
  ruleaza = true;
  try {
    const lipsa = await db.anunt.findMany({
      where: { lat: null, expiraLa: { gt: new Date() }, id: { notIn: [...esuate] } },
      select: { id: true, zona: true, judet: true, oras: true },
      orderBy: { id: "desc" },
      take: maxim,
    });
    for (const a of lipsa) {
      const p = await gasesteZona(a.zona, a.judet, a.oras);
      if (!p) {
        esuate.add(a.id);
        continue;
      }
      // Doar dacă între timp proprietarul n-a pus singur punctul.
      await db.anunt.updateMany({ where: { id: a.id, lat: null }, data: p });
    }
  } catch (e) {
    console.error("geocodare", e);
  } finally {
    ruleaza = false;
  }
}
