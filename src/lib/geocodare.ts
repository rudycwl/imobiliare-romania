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

/**
 * Adresa (stradă și număr) în localitatea aleasă: căutare structurată în Nominatim (România, localitatea, județul),
 * apoi text liber. Rezultatele mai departe de 25 km de centrul localității se ignoră.
 */
export async function gasesteAdresa(strada: string, numar: string, judet: string, oras: string): Promise<(Punct & { exact: boolean }) | null> {
  const j = getJudet(judet)?.nume;
  const o = getOras(judet, oras)?.nume;
  const st = strada.trim();
  if (!j || !o || st.length < 3) return null;
  const nr = numar.trim();
  const bucuresti = judet === "bucuresti";
  const centru = await centruLocalitate(judet, oras);
  const aproape = (p: Punct | null) => !!p && (!centru || distantaM(p, centru) <= MAX_KM_DE_LOCALITATE * 1000);
  const structurat = await cauta("", { street: `${nr ? `${nr} ` : ""}${st}`, city: bucuresti ? "București" : o, ...(bucuresti ? {} : { county: j }) });
  if (aproape(structurat)) return { ...structurat!, exact: !!nr };
  const liber = await cauta(`${st}${nr ? ` ${nr}` : ""}, ${bucuresti ? `${o}, București` : o}`);
  if (aproape(liber)) return { ...liber!, exact: !!nr };
  // Numărul nu există în OpenStreetMap: măcar strada.
  if (nr) {
    const strada = await cauta("", { street: st, city: bucuresti ? "București" : o, ...(bucuresti ? {} : { county: j }) });
    if (aproape(strada)) return { ...strada!, exact: false };
  }
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
