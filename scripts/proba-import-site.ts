// PROBĂ (doar citire): parcurge site-ul public al unei agenții Soft Imobiliar și tipărește rândurile de import.
// Nu scrie nimic în baza de date. Respectă robots.txt, o cerere la ≥1,5 s, User-Agent identificabil.
// Rulare: npx tsx scripts/proba-import-site.ts https://www.stilimobil.ro [max=20] [fisier.json]
import { writeFileSync } from "fs";
import { anuntDinPagina, listaAnunturi, paginiDeListaDinSitemap, robotsPermite, USER_AGENT_SITE } from "@/lib/import-site-softimobiliar";

const PAUZA_MS = 1500;
const MAX_PAGINI_LISTA = 200;
const MAX_PAGINI_PE_CATEGORIE = 60;

const [baza = "https://www.stilimobil.ro", maxText = "20", iesire = ""] = process.argv.slice(2);
const MAX = Number(maxText) || 20;

let ultima = 0;
let cereri = 0;
let robots = "";

async function descarca(url: string): Promise<string | null> {
  if (robots && !robotsPermite(robots, new URL(url).pathname)) {
    console.error(`robots.txt interzice ${url}`);
    return null;
  }
  const asteapta = ultima + PAUZA_MS - Date.now();
  if (asteapta > 0) await new Promise((r) => setTimeout(r, asteapta));
  ultima = Date.now();
  cereri++;
  const r = await fetch(url, { headers: { "user-agent": USER_AGENT_SITE, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }, signal: AbortSignal.timeout(60_000) });
  if (!r.ok) {
    console.error(`${r.status} ${url}`);
    return null;
  }
  return r.text();
}

async function main() {
  const rob = await descarca(new URL("/robots.txt", baza).toString());
  // Fără robots.txt citit nu știm ce e permis: ne oprim (un 404 ar însemna „totul permis”, dar aici nu riscăm).
  if (rob === null) throw new Error("Nu am putut citi robots.txt; ne oprim.");
  robots = rob;
  if (!robotsPermite(robots, "/")) throw new Error("robots.txt interzice parcurgerea site-ului; ne oprim.");

  const sitemap = (await descarca(new URL("/sitemap.xml", baza).toString())) ?? "";
  const radacini = paginiDeListaDinSitemap(sitemap);
  const dinSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+-\d+\.html)<\/loc>/g)].map((m) => m[1].trim()));
  console.error(`Sitemap: ${radacini.length} liste pe categorii, ${dinSitemap.size} linkuri de anunț.`);

  // Toate paginile de listă (cu paginare): anunțurile active sunt cele care apar în liste.
  const peCategorie = new Map<string, string[]>();
  const toate = new Set<string>();
  let paginiCitite = 0;
  for (const rad of radacini) {
    const coada = [rad];
    const vazute = new Set(coada);
    const lista: string[] = [];
    while (coada.length && paginiCitite < MAX_PAGINI_LISTA && vazute.size - coada.length < MAX_PAGINI_PE_CATEGORIE) {
      const u = coada.shift()!;
      const html = await descarca(u);
      paginiCitite++;
      if (!html) continue;
      const r = listaAnunturi(html, u);
      for (const a of r.anunturi) if (!lista.includes(a)) lista.push(a);
      for (const p of r.pagini) if (!vazute.has(p)) vazute.add(p), coada.push(p);
    }
    peCategorie.set(new URL(rad).pathname.split("/")[1], lista);
    for (const a of lista) toate.add(a);
    console.error(`${rad}: ${lista.length} anunțuri (${vazute.size} pagini)`);
  }

  // Câte un anunț din fiecare categorie pe rând, ca proba să acopere vânzare/închiriere, case, terenuri, spații.
  const alese: string[] = [];
  const liste = [...peCategorie.values()];
  for (let i = 0; alese.length < MAX && liste.some((l) => l.length > i); i++) {
    for (const l of liste) if (l[i] && !alese.includes(l[i]) && alese.length < MAX) alese.push(l[i]);
  }

  const rezultate = [];
  for (const u of alese) {
    const html = await descarca(u);
    if (!html) continue;
    const r = anuntDinPagina(html, u, { judet: "Iași", oras: "Iași" });
    const lipsa = "rand" in r ? Object.entries(r.rand).filter(([k, v]) => !v && k !== "moneda").map(([k]) => k) : [];
    rezultate.push({ url: u, ...r, campuriLipsa: lipsa });
  }

  const complete = rezultate.filter((r) => "rand" in r && !r.campuriLipsa.length).length;
  const raport = {
    site: baza,
    data: new Date().toISOString(),
    cereri,
    anunturiInListe: toate.size,
    anunturiInSitemap: dinSitemap.size,
    sitemapFaraListe: [...dinSitemap].filter((u) => !toate.has(u)).length,
    paginiDeLista: paginiCitite,
    extrase: rezultate.length,
    complete,
    anunturi: rezultate,
  };
  const text = JSON.stringify(raport, null, 2);
  if (iesire) writeFileSync(iesire, text);
  console.log(text);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
