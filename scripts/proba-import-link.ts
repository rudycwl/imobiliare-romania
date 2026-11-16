// PROBĂ (doar citire): importul din link pentru o pagină de anunț de pe site-ul unei agenții (ca la OLX).
// Nu scrie nimic în baza de date și nu urcă nimic în stocare: pozele se descarcă doar într-un dosar local (urcare simulată).
// Rulare: npx tsx scripts/proba-import-link.ts <link> [dosarPoze] [judetAgentie] [orasAgentie]
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { anuntDinPagina, pozeDinSite, valoriFormular } from "@/lib/import-site-softimobiliar";
import { descarcaPaginaAgentie, descarcaPozaAgentie } from "@/lib/pagina-agentie";

const MAX_POZE = 10; // ca în src/lib/poze.ts

async function main() {
  const [link, dosar = "", judet = "iasi", oras = "iasi"] = process.argv.slice(2);
  const p = await descarcaPaginaAgentie(link);
  if (p.stare !== "ok") return console.log(p);
  const r = anuntDinPagina(p.html, p.final.toString(), { judet, oras });
  if ("eroare" in r) return console.log(r);
  const sursa = p.final.toString();
  const poze = pozeDinSite(r.rand.poze.split(" "), sursa, MAX_POZE);
  console.log(JSON.stringify({ externId: r.externId, valoriFormular: { ...valoriFormular(r.rand), descriere: "(…)" }, pozePePagina: r.rand.poze.split(" ").filter(Boolean).length, pozeInFormular: poze.length }, null, 2));
  if (!dosar) return;
  mkdirSync(dosar, { recursive: true });
  for (const [i, url] of poze.entries()) {
    const t0 = Date.now();
    const d = await descarcaPozaAgentie(url, sursa);
    if (!d) {
      console.log(`${i + 1}. respinsă: ${url}`);
      continue;
    }
    const fisier = join(dosar, `${String(i + 1).padStart(2, "0")}.${d.tip === "image/webp" ? "webp" : "jpg"}`);
    writeFileSync(fisier, d.date);
    console.log(`${i + 1}. ${d.tip} ${(d.date.length / 1024).toFixed(0)} KB după ${Date.now() - t0} ms → ${fisier} (urcare simulată)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
