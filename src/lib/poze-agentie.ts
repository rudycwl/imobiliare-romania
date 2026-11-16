import "server-only";
import { pozeDinSite } from "./import-site-softimobiliar";
import { descarcaPozaAgentie } from "./pagina-agentie";
import { adaugaPoza, cheieNoua, MAX_POZE } from "./poze";
import { puneInR2, r2Configurat, salveazaLocal, stocareLocala } from "./stocare";

/**
 * După publicarea unui anunț importat din link: descarcă pozele alese în formular (în ordinea lor)
 * și le urcă în stocarea pozelor (discul serverului sau R2), ca la încărcarea manuală. Întoarce câte au intrat.
 */
export async function atasazaPozeDinSite(anuntId: number, sursa: string, urls: string[], deja = 0): Promise<number> {
  if (!stocareLocala() && !r2Configurat()) return 0;
  let puse = 0;
  for (const url of pozeDinSite(urls, sursa, Math.max(0, MAX_POZE - deja))) {
    const p = await descarcaPozaAgentie(url, sursa).catch(() => null);
    if (!p) continue;
    const cheie = cheieNoua(anuntId, p.tip);
    try {
      if (stocareLocala()) await salveazaLocal(cheie, p.date);
      else await puneInR2(cheie, p.date, p.tip);
    } catch (e) {
      console.error("poze agenție", e);
      continue;
    }
    await adaugaPoza(anuntId, cheie, url);
    puse++;
  }
  return puse;
}
