import "server-only";

// Cursul euro → lei, pentru prețul în lei afișat lângă cel în euro. Întâi cursul oficial BNR, apoi cel al BCE.
// Se reîmprospătează la 6 ore; dacă ambele surse cad, rămâne ultimul curs bun (sau nu se mai afișează lei).

const SURSE: { url: string; regex: RegExp }[] = [
  { url: "https://www.bnr.ro/nbrfxrates.xml", regex: /<Rate currency="EUR">([\d.]+)<\/Rate>/ },
  { url: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", regex: /currency=['"]RON['"]\s+rate=['"]([\d.]+)['"]/ },
];

const g = globalThis as unknown as { __curs?: number };

/** Un curs plauzibil (lei pentru 1 €) sau null. */
export function citesteCurs(xml: string, regex: RegExp) {
  const v = Number(xml.match(regex)?.[1]);
  return v > 3 && v < 10 ? v : null;
}

export async function cursEuro(): Promise<number | null> {
  for (const s of SURSE) {
    try {
      const r = await fetch(s.url, { next: { revalidate: 6 * 3600 }, signal: AbortSignal.timeout(4000) });
      const v = r.ok ? citesteCurs(await r.text(), s.regex) : null;
      if (v) return (g.__curs = v);
    } catch {
      /* încercăm sursa următoare */
    }
  }
  return g.__curs ?? null;
}
