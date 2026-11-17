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
/** Câte cereri spre Nominatim / Photon au eșuat (rețea, timeout, 429…), ca o eroare să nu fie luată drept „nu există”. */
let eroriRetea = 0;
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
      if (!res.ok) return (eroriRetea++, undefined);
      const [p] = (await res.json()) as { lat: string; lon: string }[];
      return p ? { lat: Number(p.lat), lng: Number(p.lon) } : null;
    } catch {
      eroriRetea++;
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

export type SursaLoc = "adresa" | "zona" | "localitate";
export type LocGasit = Punct & { sursa: SursaLoc };

/**
 * Centrul cartierului după numele din anunț (sursa „zona”) sau, dacă nu-l găsește în localitate sau zona lipsește,
 * centrul localității (sursa „localitate”). null = nici localitatea (de obicei Nominatim indisponibil).
 */
export async function zonaSauLocalitate(zona: string, judet: string, oras: string): Promise<LocGasit | null> {
  const o = getOras(judet, oras)?.nume;
  if (!o) return null;
  const centru = await centruLocalitate(judet, oras);
  const z = zona.trim();
  if (z && slug(z) !== slug(o)) {
    // Până la 5 rezultate, primul din localitatea aleasă: „Tudor Vladimirescu, Iași” întoarce întâi satul
    // Tudor Vladimirescu (com. Mogoșești-Siret), abia apoi cartierul din Iași.
    const bucuresti = judet === "bucuresti";
    const p = alegeAdresa(await cautaAdrese(`${z}, ${bucuresti ? "București" : o}`), o, "", bucuresti);
    if (p && (!centru || distantaM(p, centru) <= MAX_KM_DE_LOCALITATE * 1000)) return { lat: p.lat, lng: p.lng, sursa: "zona" };
  }
  return centru ? { ...centru, sursa: "localitate" } : null;
}

/** Centrul cartierului (sau, dacă nu-l găsește în localitate, al localității) după numele din anunț. */
export async function gasesteZona(zona: string, judet: string, oras: string): Promise<Punct | null> {
  const r = await zonaSauLocalitate(zona, judet, oras);
  return r ? { lat: r.lat, lng: r.lng } : null;
}

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Distanța maximă (km) dintre adresa găsită și centrul localității: altfel e altă stradă cu același nume. */
const MAX_KM_DE_LOCALITATE = 25;

/** Un rezultat Nominatim cu adresa detaliată (addressdetails=1). */
export type RezultatAdresa = { lat: string; lon: string; name?: string; category?: string; boundingbox?: string[]; address?: Record<string, string | undefined> };

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
      const url = `${NOMINATIM}?format=jsonv2${parametri?.limit ? "" : "&limit=5"}&addressdetails=1&countrycodes=ro&accept-language=ro&${q}`;
      const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return (eroriRetea++, undefined);
      return (await res.json()) as RezultatAdresa[];
    } catch {
      eroriRetea++;
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
      if (!res.ok) return (eroriRetea++, undefined);
      const j = (await res.json()) as { address?: { road?: string; pedestrian?: string; house_number?: string; country_code?: string } };
      const a = j.address;
      if (!a || a.country_code !== "ro") return null;
      const strada = a.road ?? a.pedestrian ?? "";
      return strada ? { strada, numar: a.house_number ?? "" } : null;
    } catch {
      eroriRetea++;
      return undefined;
    }
  });
  if (r !== undefined) cacheInvers.set(cheie, r);
  return r ?? null;
}

// ---------- Sugestii de străzi (câmpul „Stradă” din formular) ----------

/** Text pentru comparat: fără diacritice (și ş/ţ cu sedilă), litere mici, doar litere și cifre, spații simple. */
export function normalizeazaStrada(s: string): string {
  // „î” în interiorul cuvântului = „â” (ortografia veche: „Sfînt” = „Sfânt”), ca să nu apară aceeași stradă de două ori.
  return slug(s.replace(/[şŞ]/g, "s").replace(/[ţŢ]/g, "t").replace(/(?<=\p{L})[îÎ](?=\p{L})/gu, "â"))
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type CandidatStrada = { nume: string; localitati: (string | undefined)[] };

/**
 * Din rezultatele brute (Photon sau Nominatim): doar străzile din localitatea aleasă care conțin toate cuvintele
 * scrise (ca început de cuvânt, fără diacritice: „bratianu” → „Strada Ion C. Brătianu”), fără dubluri (aceeași
 * stradă vine pe mai multe bucăți), cel mult `max`. Întâi cele în care primul cuvânt scris începe numele propriu-zis.
 */
export function filtreazaStrazi(candidati: CandidatStrada[], text: string, oras: string, max = 8, bucuresti = false): string[] {
  const cuvinteScrise = normalizeazaStrada(text).split(" ").filter(Boolean);
  if (!cuvinteScrise.length) return [];
  const tinta = normalizeazaStrada(bucuresti ? "București" : oras);
  const vazute = new Set<string>();
  const bune: { nume: string; scor: number }[] = [];
  for (const c of candidati) {
    const nume = c.nume?.trim();
    if (!nume || !c.localitati.some((l) => l && normalizeazaStrada(l) === tinta)) continue;
    const n = normalizeazaStrada(nume);
    if (vazute.has(n)) continue;
    const cuv = n.split(" ");
    if (!cuvinteScrise.every((w) => cuv.some((x) => x.startsWith(w)))) continue;
    vazute.add(n);
    // Scor: potrivire după tipul străzii („Strada”, „Bd.”) mai jos; nume scurte mai sus.
    const primul = cuv.findIndex((x) => x.startsWith(cuvinteScrise[0]));
    bune.push({ nume, scor: (primul === 0 && cuv.length > 1 ? 100 : 0) + n.length });
  }
  return bune.sort((x, y) => x.scor - y.scor).slice(0, max).map((x) => x.nume);
}

const cacheZonaLocalitate = new Map<string, { centru: Punct; box: [number, number, number, number] } | null>();

/** Zona localității (centru + dreptunghi: vest, sud, est, nord), din Nominatim; cache în memorie. */
async function zonaLocalitate(judet: string, oras: string) {
  const cheie = `${judet}|${oras}`;
  if (cacheZonaLocalitate.has(cheie)) return cacheZonaLocalitate.get(cheie)!;
  const j = getJudet(judet)?.nume;
  const o = getOras(judet, oras)?.nume;
  if (!j || !o) return null;
  const rez = await cautaAdrese("", judet === "bucuresti" ? { city: "București" } : { city: o, county: j });
  const r = rez.find((x) => x.boundingbox?.length === 4);
  if (!r) return null; // eroare de rețea sau nimic găsit: nu ținem minte, se reîncearcă
  const [s, n, v, e] = r.boundingbox!.map(Number);
  const z = { centru: { lat: Number(r.lat), lng: Number(r.lon) }, box: [v, s, e, n] as [number, number, number, number] };
  cacheZonaLocalitate.set(cheie, z);
  return z;
}

const PHOTON = "https://photon.komoot.io/api/";
const cacheSugestii = new Map<string, string[]>();

/** Photon (OpenStreetMap, potrivire și după începutul cuvântului), doar străzi, în dreptunghiul localității. */
async function cautaPhoton(text: string, box: [number, number, number, number]): Promise<CandidatStrada[] | undefined> {
  return laRand(async () => {
    try {
      const url = `${PHOTON}?q=${encodeURIComponent(text)}&limit=20&layer=street&bbox=${box.join(",")}`;
      const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return undefined;
      const j = (await res.json()) as { features?: { properties?: Record<string, string | undefined> }[] };
      return (j.features ?? []).map(({ properties: p = {} }) => ({ nume: p.name ?? "", localitati: [p.city, p.town, p.village, p.municipality, p.locality] }));
    } catch {
      return undefined; // Photon e doar pentru sugestii; o eroare aici nu oprește completarea coordonatelor
    }
  });
}

/** Nominatim în dreptunghiul localității (bounded): găsește cuvinte întregi („bratianu”), nu început de cuvânt. */
async function cautaNominatimStrazi(text: string, box: [number, number, number, number]): Promise<CandidatStrada[]> {
  const [v, s, e, n] = box;
  const rez = await cautaAdrese("", { q: text, viewbox: `${v},${n},${e},${s}`, bounded: "1", limit: "40" });
  return rez
    .filter((r) => r.category === "highway" || r.address?.road)
    .map((r) => ({
      nume: (r.category === "highway" ? r.name : r.address?.road) ?? r.address?.road ?? "",
      localitati: CAMPURI_LOCALITATE.map((k) => r.address?.[k]),
    }));
}

/**
 * Străzile din localitatea aleasă care se potrivesc cu ce a scris omul (de la 3 litere), pentru lista de sugestii.
 * Întâi Photon (știe și început de cuvânt), apoi Nominatim dacă Photon nu răspunde sau nu găsește. Cererile trec
 * pe rând (≤ 1 pe secundă) și rezultatele se țin minte. Lista goală = omul scrie strada liber, ca până acum.
 */
export async function sugestiiStrazi(text: string, judet: string, oras: string, max = 8): Promise<string[]> {
  const t = text.trim().slice(0, 80);
  const o = getOras(judet, oras)?.nume;
  if (!o || normalizeazaStrada(t).replace(/ /g, "").length < 3) return [];
  const cheie = `${judet}|${oras}|${normalizeazaStrada(t)}`;
  if (cacheSugestii.has(cheie)) return cacheSugestii.get(cheie)!;
  const zona = await zonaLocalitate(judet, oras);
  if (!zona) return [];
  const bucuresti = judet === "bucuresti";
  let lista = filtreazaStrazi((await cautaPhoton(t, zona.box)) ?? [], t, o, max, bucuresti);
  if (!lista.length) lista = filtreazaStrazi(await cautaNominatimStrazi(t, zona.box), t, o, max, bucuresti);
  if (cacheSugestii.size > 2000) cacheSugestii.clear();
  cacheSugestii.set(cheie, lista);
  return lista;
}

/** Anunțul, cât trebuie pentru locul lui aproximativ. */
export type LocAnunt = { strada?: string | null; numar?: string | null; zona: string; judet: string; oras: string };

/**
 * Locul aproximativ al unui anunț fără punct pe hartă: adresa (stradă + număr, doar în localitatea aleasă, vezi
 * gasesteAdresa) → zona / cartierul → centrul localității (gasesteZona). Pe site apare mereu ca zonă (cerc),
 * pentru că punctul nu e pus de proprietar (punctProprietar = false, vezi src/lib/locatie.ts).
 */
export async function locAproximativ(a: LocAnunt): Promise<LocGasit | "eroare" | null> {
  const erori = eroriRetea;
  if (a.strada && a.strada.trim().length >= 3) {
    const p = await gasesteAdresa(a.strada, a.numar ?? "", a.judet, a.oras);
    if (p) return { lat: p.lat, lng: p.lng, sursa: "adresa" };
  }
  const r = await zonaSauLocalitate(a.zona, a.judet, a.oras);
  // O cerere eșuată pe drum (rețea, timeout, limită Nominatim) nu e „nu există”: fără ea poate s-ar fi găsit strada
  // sau cartierul. Nu salvăm centrul localității în locul lor; se reîncearcă la rularea următoare.
  if ((!r || r.sursa === "localitate") && eroriRetea !== erori) return "eroare";
  return r;
}

/** Centrul localității, pentru pagina unui anunț care încă nu are loc pe hartă (cache în memorie, după prima cerere). */
export async function centruPentruPagina(judet: string, oras: string, asteptareMs = 3000): Promise<Punct | null> {
  return Promise.race([centruLocalitate(judet, oras).catch(() => null), new Promise<null>((ok) => setTimeout(() => ok(null), asteptareMs))]);
}

/** Anunțurile pentru care nu s-a găsit nimic (nici localitatea), cu momentul: se reîncearcă după o oră. */
const esuate = new Map<number, number>();
const ORA_MS = 60 * 60_000;
let ruleaza = false;

const faraEsuate = () => {
  const acum = Date.now();
  for (const [id, la] of esuate) if (acum - la > ORA_MS) esuate.delete(id);
  return [...esuate.keys()];
};

/**
 * Pune pe hartă anunțurile fără coordonate: locAproximativ (stradă → zonă → centrul localității), mereu aproximativ,
 * cu sursa punctului (sursaLoc). Se apelează în fundal după salvare (câteva odată) și o dată la pornirea serverului
 * (`toate`: și cele expirate, pe loturi). Idempotentă: atinge doar anunțurile cu lat = null și nu suprascrie un punct
 * pus între timp de proprietar. La o eroare de rețea / limită Nominatim se oprește (nimic salvat greșit), iar
 * anunțul rămâne pentru rularea următoare. Cererile trec pe rând (laRand: ≤ 1 pe secundă, cu User-Agent).
 */
export async function completeazaCoordonate(maxim = 15, { toate = false, ids }: { toate?: boolean; ids?: number[] } = {}) {
  if (ruleaza) return { completate: 0, esuate: 0, oprit: false };
  ruleaza = true;
  let completate = 0;
  let gresite = 0;
  let oprit = false;
  try {
    for (;;) {
      const lipsa = await db.anunt.findMany({
        where: { lat: null, id: { notIn: faraEsuate(), ...(ids ? { in: ids } : {}) }, ...(toate ? {} : { expiraLa: { gt: new Date() } }) },
        select: { id: true, strada: true, numar: true, zona: true, judet: true, oras: true },
        orderBy: { id: "desc" },
        take: Math.min(maxim, 50),
      });
      for (const a of lipsa) {
        const p = await locAproximativ(a);
        if (p === "eroare") {
          oprit = true;
          break;
        }
        if (!p) {
          esuate.set(a.id, Date.now());
          gresite++;
          continue;
        }
        // Doar dacă între timp proprietarul n-a pus singur punctul.
        const r = await db.anunt.updateMany({ where: { id: a.id, lat: null }, data: { lat: p.lat, lng: p.lng, punctProprietar: false, sursaLoc: p.sursa } });
        completate += r.count;
      }
      if (oprit || !toate || lipsa.length === 0 || completate + gresite >= maxim) break;
    }
  } catch (e) {
    console.error("geocodare", e);
  } finally {
    ruleaza = false;
  }
  return { completate, esuate: gresite, oprit };
}

/**
 * O singură dată pentru punctele puse automat înainte de sursaLoc (sursaLoc = null, punctProprietar = false):
 * se recalculează cu regula de acum și se notează sursa. Corectează anunțurile puse greșit pe centrul localității
 * deși au cartier (ex. #6 „Tudor Vladimirescu, Iași”: completarea veche lua primul rezultat Nominatim – satul
 * Tudor Vladimirescu de lângă Pașcani –, îl respingea și cădea pe centrul Iașului). Idempotentă: după ea sursaLoc
 * e completat; nu atinge punctele puse de proprietar. La o eroare de rețea se oprește și se reia la pornirea următoare.
 */
export async function recompleteazaCoordonate({ ids }: { ids?: number[] } = {}) {
  if (ruleaza) return { refacute: 0, mutate: 0, oprit: false };
  ruleaza = true;
  let refacute = 0;
  let mutate = 0;
  let oprit = false;
  try {
    for (;;) {
      const vechi = await db.anunt.findMany({
        where: { punctProprietar: false, sursaLoc: null, lat: { not: null }, id: { notIn: faraEsuate(), ...(ids ? { in: ids } : {}) } },
        select: { id: true, strada: true, numar: true, zona: true, judet: true, oras: true, lat: true, lng: true },
        orderBy: { id: "desc" },
        take: 50,
      });
      for (const a of vechi) {
        const p = await locAproximativ(a);
        if (p === "eroare") {
          oprit = true;
          break;
        }
        if (!p) {
          esuate.set(a.id, Date.now());
          continue;
        }
        const r = await db.anunt.updateMany({
          where: { id: a.id, punctProprietar: false, sursaLoc: null },
          data: { lat: p.lat, lng: p.lng, sursaLoc: p.sursa },
        });
        refacute += r.count;
        if (r.count && distantaM(p, { lat: a.lat!, lng: a.lng! }) > 50) mutate++;
      }
      if (oprit || vechi.length === 0) break;
    }
  } catch (e) {
    console.error("geocodare (recompletare)", e);
  } finally {
    ruleaza = false;
  }
  return { refacute, mutate, oprit };
}
