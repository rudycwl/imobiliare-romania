import "server-only";
import { db } from "./db";
import { getJudet, getOras } from "./geo";

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

async function cauta(text: string): Promise<Punct | null> {
  const cheie = text.toLowerCase();
  if (cache.has(cheie)) return cache.get(cheie)!;
  const r = await laRand(async () => {
    try {
      const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=ro&accept-language=ro&q=${encodeURIComponent(text)}`;
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

/** Centrul cartierului (sau, dacă nu-l găsește, al orașului) după numele din anunț. */
export async function gasesteZona(zona: string, judet: string, oras: string): Promise<Punct | null> {
  const j = getJudet(judet)?.nume;
  const o = getOras(judet, oras)?.nume;
  if (!j || !o) return null;
  const z = zona.trim();
  return (z && (await cauta(`${z}, ${o}, județul ${j}`))) || (await cauta(`${o}, județul ${j}`));
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
