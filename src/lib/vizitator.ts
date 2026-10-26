import "server-only";
import path from "path";

// Platforma și localitatea unei vizite, pentru statistici. Adresa IP se folosește doar pe loc și nu se salvează.

export type Platforma = { dispozitiv: string; sistem: string; browser: string };

/** Din User-Agent: telefon/tabletă/calculator, sistemul de operare și browserul. */
export function platforma(ua: string): Platforma {
  const tableta = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);
  const telefon = !tableta && /Mobi|iPhone|iPod|Android/i.test(ua);
  const sistem = /iPhone|iPod/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Mac OS X|Macintosh/.test(ua)
              ? "macOS"
              : /Linux/.test(ua)
                ? "Linux"
                : "altul";
  // Ordinea contează: Edge, Opera și Samsung se prezintă și ca Chrome; aplicațiile își deschid browserul propriu.
  const browser = /FBAN|FBAV|FB_IAB/.test(ua)
    ? "Facebook (aplicație)"
    : /Instagram/.test(ua)
      ? "Instagram (aplicație)"
      : /Edg\//.test(ua)
        ? "Edge"
        : /OPR\/|Opera/.test(ua)
          ? "Opera"
          : /SamsungBrowser/.test(ua)
            ? "Samsung Internet"
            : /Firefox|FxiOS/.test(ua)
              ? "Firefox"
              : /Chrome|CriOS/.test(ua)
                ? "Chrome"
                : /Safari/.test(ua)
                  ? "Safari"
                  : "altul";
  return { dispozitiv: tableta ? "Tabletă" : telefon ? "Telefon" : "Calculator", sistem, browser };
}

type Rand = { city?: string; state1?: string; country_code?: string };
// Tipurile din pachet sunt pentru bazele MaxMind; rândurile DB-IP au alt format, deci le citim ca Rand.
type Baza = { get(ip: string): unknown };
const g = globalThis as unknown as { __geo?: Promise<{ v4: Baza; v6: Baza } | null> };

// Baza DB-IP Lite (CC BY 4.0, https://db-ip.com) vine din pachetul npm; calea se construiește la rulare.
const fisier = (nume: string) => path.join(process.cwd(), "node_modules", "@ip-location-db", "dbip-city-mmdb", nume);

function baze() {
  return (g.__geo ??= (async () => {
    try {
      const { open } = await import("maxmind");
      return { v4: await open(fisier("dbip-city-ipv4.mmdb")), v6: await open(fisier("dbip-city-ipv6.mmdb")) };
    } catch (e) {
      console.error("Baza de localități (DB-IP) nu s-a deschis:", e);
      return null;
    }
  })());
}

/** Localitatea aproximativă a adresei IP, sau null (adresă locală, necunoscută sau baza lipsă). */
export async function localitate(ip: string) {
  const v6 = ip.includes(":");
  if (!/^[\d.]+$|:/.test(ip)) return null;
  const b = await baze();
  try {
    const r = b && ((v6 ? b.v6 : b.v4).get(ip) as Rand | null);
    if (!r?.country_code) return null;
    return { oras: r.city || null, regiune: r.state1?.replace(/ County$/, "") || null, tara: r.country_code };
  } catch {
    return null;
  }
}
