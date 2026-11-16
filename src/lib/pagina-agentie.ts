import { lookup } from "dns/promises";
import { ipPrivat } from "./ip";
import { paginaDisparuta, robotsPermite, USER_AGENT_SITE } from "./import-site-softimobiliar";

// Descărcarea unei pagini de anunț de pe site-ul unei agenții (importul din link, ca la OLX).
// Doar adrese publice, User-Agent identificabil, robots.txt respectat, cel mult o cerere la 1,5 s pe același site.

const MAX_OCTETI = 3 * 1024 * 1024;
const PAUZA_MS = 1500;
const ultimaCerere = new Map<string, number>();
const robotsCache = new Map<string, { text: string; la: number }>();

export type PaginaAgentie = { stare: "ok"; html: string; final: URL } | { stare: "disparut" } | { stare: "interzis" };

async function adresaPublica(u: URL) {
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Linkul trebuie să înceapă cu https://.");
  if (u.username || u.password) throw new Error("Linkul nu poate conține utilizator și parolă.");
  const adrese = await lookup(u.hostname, { all: true }).catch(() => []);
  if (!adrese.length) throw new Error(`Site-ul „${u.hostname}” nu există sau nu răspunde.`);
  if (adrese.some((a) => ipPrivat(a.address))) throw new Error("Linkul trebuie să ducă la un site public.");
}

async function cerere(u: URL, accept: string) {
  await adresaPublica(u);
  const asteapta = (ultimaCerere.get(u.host) ?? 0) + PAUZA_MS - Date.now();
  if (asteapta > 0) await new Promise((r) => setTimeout(r, asteapta));
  ultimaCerere.set(u.host, Date.now());
  return fetch(u, { redirect: "manual", headers: { "user-agent": USER_AGENT_SITE, accept, "accept-language": "ro-RO,ro;q=0.9" }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
}

/** robots.txt al site-ului (ținut o oră). Lipsă (4xx) = totul permis; eroare de server = nu riscăm. */
async function robots(u: URL): Promise<string> {
  const c = robotsCache.get(u.origin);
  if (c && Date.now() - c.la < 3600_000) return c.text;
  const r = await cerere(new URL("/robots.txt", u.origin), "text/plain,*/*");
  let text = "";
  if (r.ok) text = (await r.text()).slice(0, 500_000);
  else if (r.status >= 500) throw new Error("Site-ul agenției nu răspunde acum (robots.txt). Încearcă din nou mai târziu.");
  robotsCache.set(u.origin, { text, la: Date.now() });
  return text;
}

export async function descarcaPaginaAgentie(link: string): Promise<PaginaAgentie> {
  const cerut = new URL(link.trim());
  if (!robotsPermite(await robots(cerut), cerut.pathname + cerut.search)) return { stare: "interzis" };
  let adresa = cerut;
  for (let i = 0; i < 4; i++) {
    const r = await cerere(adresa, "text/html,application/xhtml+xml,*/*;q=0.8");
    const loc = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && loc) {
      adresa = new URL(loc, adresa);
      if (adresa.host !== cerut.host && adresa.host.replace(/^www\./, "") !== cerut.host.replace(/^www\./, "")) return { stare: "disparut" };
      continue;
    }
    if (paginaDisparuta(cerut, adresa, r.status)) return { stare: "disparut" };
    if (!r.ok) throw new Error(`Site-ul agenției a răspuns cu eroarea ${r.status}.`);
    if (Number(r.headers.get("content-length") ?? 0) > MAX_OCTETI) throw new Error("Pagina e prea mare.");
    const date = Buffer.from(await r.arrayBuffer());
    if (date.length > MAX_OCTETI) throw new Error("Pagina e prea mare.");
    return { stare: "ok", html: date.toString("utf-8"), final: adresa };
  }
  throw new Error("Prea multe redirecționări.");
}
