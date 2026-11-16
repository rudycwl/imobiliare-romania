"use server";

import { utilizatorCurent } from "@/lib/auth";
import { cursEuro } from "@/lib/curs";
import { anuntIndisponibil, extrageAnunt, numeSite, urlPermis, SITE_IMPORT, type AnuntImportat } from "@/lib/import-anunt";
import { anuntDinPagina, esteLinkAnuntAgentie, pozeDinSite, valoriFormular } from "@/lib/import-site-softimobiliar";
import { MAX_POZE } from "@/lib/poze";
import { descarcaPaginaAgentie } from "@/lib/pagina-agentie";

export type RezultatImport = { eroare?: string; valori?: AnuntImportat };

/**
 * Proprietarul lipește linkul anunțului SĂU de pe alt site; citim doar acea pagină, o singură dată,
 * și precompletăm formularul. Nu salvăm nimic: omul verifică și publică el.
 */
export async function importaAnunt(link: string): Promise<RezultatImport> {
  const u = await utilizatorCurent();
  if (!u) return { eroare: "Autentifică-te mai întâi." };
  if (u.tip === "agentie") return importaDeLaAgentie(link, u);
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

/**
 * Agenția lipește linkul unui anunț de pe propriul site (șablon Soft Imobiliar, ex. …-de-vanzare-…-35590.html).
 * Același flux ca la OLX: citim pagina o dată, precompletăm formularul, agenția verifică și publică.
 */
async function importaDeLaAgentie(link: string, u: { judet: string; oras: string }): Promise<RezultatImport> {
  if (!esteLinkAnuntAgentie(link))
    return { eroare: "Lipește linkul unei pagini de anunț de pe site-ul agenției (de forma https://www.agentia-ta.ro/apartament-3-camere-de-vanzare-…-12345.html)." };
  try {
    const p = await descarcaPaginaAgentie(link);
    if (p.stare === "interzis") return { eroare: "Site-ul agenției nu permite citirea automată a acestei pagini (robots.txt). Completează manual." };
    if (p.stare === "disparut") return { eroare: "Anunțul nu mai există pe site-ul agenției (pagina a dispărut sau duce la lista de anunțuri). Completează manual." };
    const r = anuntDinPagina(p.html, p.final.toString(), {
      cursEuro: /RON|LEI/i.test(p.html) ? await cursEuro() : null,
      judet: u.judet,
      oras: u.oras,
    });
    if ("eroare" in r) {
      if (/nu e un anunț|nu are cod/.test(r.eroare))
        return { eroare: "Nu am recunoscut pagina ca anunț. Deocamdată importăm de pe site-urile agențiilor făcute cu Soft Imobiliar; completează manual sau scrie-ne la agentii@cheiamea.ro." };
      return { eroare: `Nu am putut importa anunțul: ${r.eroare}. Completează manual.` };
    }
    const valori = valoriFormular(r.rand);
    if (!valori.titlu) return { eroare: "Nu am găsit datele anunțului pe pagină. Completează manual." };
    const sursa = p.final.toString();
    const poze = pozeDinSite((r.rand.poze ?? "").split(/\s+/), sursa, MAX_POZE);
    return { valori: { ...valori, sursa, ...(poze.length ? { poze: poze.join(" ") } : {}) } };
  } catch (e) {
    const nostru = e instanceof Error && !["TimeoutError", "AbortError", "TypeError"].includes(e.name);
    return { eroare: nostru ? `${(e as Error).message} Încearcă din nou sau completează manual.` : "Site-ul agenției nu a răspuns la timp. Încearcă din nou sau completează manual." };
  }
}
