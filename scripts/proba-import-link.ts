// PROBĂ (doar citire): importul din link pentru o pagină de anunț de pe site-ul unei agenții (ca la OLX).
// Nu scrie nimic în baza de date. Rulare: npx tsx scripts/proba-import-link.ts <link> [judetAgentie] [orasAgentie]
import { anuntDinPagina, valoriFormular } from "@/lib/import-site-softimobiliar";
import { descarcaPaginaAgentie } from "@/lib/pagina-agentie";

const [link, judet = "iasi", oras = "iasi"] = process.argv.slice(2);
async function main() {
  const p = await descarcaPaginaAgentie(link);
  if (p.stare !== "ok") {
    console.log(p);
  } else {
    const r = anuntDinPagina(p.html, p.final.toString(), { judet, oras });
    console.log(JSON.stringify("eroare" in r ? r : { externId: r.externId, valoriFormular: valoriFormular(r.rand), poze: r.rand.poze.split(" ").filter(Boolean).length }, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
