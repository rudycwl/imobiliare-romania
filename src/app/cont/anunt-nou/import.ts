"use server";

import { utilizatorCurent } from "@/lib/auth";
import { anuntIndisponibil, extrageAnunt, numeSite, urlPermis, SITE_IMPORT, type AnuntImportat } from "@/lib/import-anunt";

export type RezultatImport = { eroare?: string; valori?: AnuntImportat };

/**
 * Proprietarul lipește linkul anunțului SĂU de pe alt site; citim doar acea pagină, o singură dată,
 * și precompletăm formularul. Nu salvăm nimic: omul verifică și publică el.
 */
export async function importaAnunt(link: string): Promise<RezultatImport> {
  const u = await utilizatorCurent();
  if (!u) return { eroare: "Autentifică-te mai întâi." };
  if (u.tip === "agentie") return { eroare: "Importul e disponibil doar pentru persoane fizice și firme." };
  const url = urlPermis(link);
  if (!url) return { eroare: `Lipește linkul complet al anunțului tău de pe: ${SITE_IMPORT.join(", ")}.` };

  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; CheiaMea-import/1.0; +https://cheiamea.ro)", "accept-language": "ro-RO,ro;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (r.url && !urlPermis(r.url)) return { eroare: "Linkul duce în afara site-urilor acceptate." };
    const final = new URL(r.url || url);
    const inactiv = `Anunțul nu mai e activ pe ${numeSite(url)} (inactiv, expirat sau șters), așa că nu are ce să se importe. Reactivează-l acolo și încearcă din nou, sau completează manual.`;
    if (r.status === 404 || r.status === 410) return { eroare: inactiv };
    if (!r.ok) return { eroare: "Nu am putut deschide anunțul. Verifică linkul sau completează manual." };
    const html = (await r.text()).slice(0, 2_000_000);
    if (anuntIndisponibil(html, url, final, r.status)) return { eroare: inactiv };
    const valori = extrageAnunt(html, final);
    if (!valori.titlu) return { eroare: "Nu am găsit datele anunțului pe pagină. Completează manual." };
    return { valori };
  } catch {
    return { eroare: "Site-ul nu a răspuns la timp. Încearcă din nou sau completează manual." };
  }
}
