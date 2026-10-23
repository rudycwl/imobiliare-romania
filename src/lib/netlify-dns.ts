import "server-only";

// Rândurile DNS ale domeniilor stau în Netlify DNS. Cu NETLIFY_TOKEN (token personal Netlify, pus în /configurare),
// pagina /admin/email le adaugă singură, ca proprietarul să nu le mai copieze de mână.

export const netlifyConfigurat = () => !!process.env.NETLIFY_TOKEN?.trim();

export type RandNou = { type: string; hostname: string; value: string; priority?: number };

async function api(metoda: "GET" | "POST", cale: string, corp?: unknown) {
  const r = await fetch(`https://api.netlify.com/api/v1${cale}`, {
    method: metoda,
    headers: { authorization: `Bearer ${process.env.NETLIFY_TOKEN?.trim()}`, "content-type": "application/json" },
    body: corp === undefined ? undefined : JSON.stringify(corp),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Netlify ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/**
 * Adaugă rândurile care lipsesc în zona DNS a domeniului. Un rând existent cu același tip și nume nu se dublează;
 * la A și CNAME, unul existent cu altă valoare rămâne neatins și apare la „sărite”, ca să nu stricăm ce merge.
 */
export async function adaugaRanduri(domeniu: string, randuri: RandNou[]) {
  const zone: { id: string; name: string }[] = await api("GET", "/dns_zones");
  const zona = zone.find((z) => z.name === domeniu);
  if (!zona) throw new Error(`Zona ${domeniu} nu e în Netlify DNS.`);
  const existente: { type: string; hostname: string; value: string }[] = await api("GET", `/dns_zones/${zona.id}/dns_records`);
  const curat = (v: string) => v.replace(/^"|"$/g, "").replace(/\.$/, "").toLowerCase();
  const adaugate: string[] = [];
  const sarite: string[] = [];
  for (const r of randuri) {
    const acelasiNume = existente.filter((e) => e.type === r.type && curat(e.hostname) === curat(r.hostname));
    if (acelasiNume.some((e) => curat(e.value) === curat(r.value))) continue;
    // TXT pe același nume pot fi mai multe (ex. verificări pentru servicii diferite), cu excepția DMARC, care e unul singur.
    if (acelasiNume.length && (r.type !== "TXT" || r.hostname.startsWith("_dmarc."))) {
      sarite.push(`${r.type} ${r.hostname} (există deja cu altă valoare)`);
      continue;
    }
    await api("POST", `/dns_zones/${zona.id}/dns_records`, { ...r, ttl: 3600 });
    adaugate.push(`${r.type} ${r.hostname}`);
  }
  return { adaugate, sarite };
}
