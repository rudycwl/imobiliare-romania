// PROBĂ (doar citire): ce ar face actualizarea periodică pentru linkurile date. Nu scrie nimic în baza de date sau în stocare.
// Rulare: npx tsx scripts/proba-actualizare-site.ts <link> [<link> …]
import { anuntDinPagina, decizii, pozeDinSite, type Verificare } from "@/lib/import-site-softimobiliar";
import { descarcaPaginaAgentie } from "@/lib/pagina-agentie";

async function verifica(link: string): Promise<Verificare> {
  try {
    const p = await descarcaPaginaAgentie(link);
    if (p.stare === "disparut") return { tip: "disparut" };
    if (p.stare === "interzis") return { tip: "eroare", motiv: "robots.txt" };
    const r = anuntDinPagina(p.html, p.final.toString(), { judet: "iasi", oras: "iasi" });
    if ("rand" in r) return { tip: "ok", externId: r.externId, rand: { ...r.rand, poze: pozeDinSite(r.rand.poze.split(" "), p.final.toString(), 100).join(" ") } };
    return /nu e un anunț|nu are cod/.test(r.eroare) ? { tip: "disparut" } : { tip: "eroare", motiv: r.eroare };
  } catch (e) {
    return { tip: "eroare", motiv: String(e) };
  }
}

async function main() {
  const linkuri = process.argv.slice(2);
  const v = [];
  for (const l of linkuri) v.push(await verifica(l));
  for (const lipsuri of [0, 1]) {
    const d = decizii(v.map((x, i) => ({ anuntId: i, proprietarId: "agentie", lipsuriInainte: lipsuri, v: x })));
    console.log(`\nDacă pagina a lipsit de ${lipsuri} ori înainte:`);
    v.forEach((x, i) => {
      const c = x.tip === "ok" ? (({ titlu, pret, suprafata, camere, zona, poze }) => ({ titlu, pret, suprafata, camere, zona, galerie: poze.split(" ").length }))(x.rand) : x;
      console.log(`${linkuri[i]}\n  → ${d.get(i)}`, JSON.stringify(c));
    });
  }
}

main();
