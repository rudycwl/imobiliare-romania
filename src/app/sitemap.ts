import type { MetadataRoute } from "next";
import { JUDETE } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";
import { indiceOrase, MIN_ANUNTURI } from "@/lib/indice";
import { activ } from "@/lib/anunturi";
import { db } from "@/lib/db";
import { caleImpozite } from "@/lib/impozite-locale";
import { citesteImpozite } from "@/lib/continut-db";

const BAZA = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agentii, orase, anunturi, peOras, proiecte, cartiere] = await Promise.all([
    getAgentii(),
    indiceOrase(),
    db.anunt.findMany({ where: activ(), select: { id: true, ordine: true }, orderBy: { id: "desc" }, take: 45_000 }),
    db.anunt.groupBy({ by: ["judet", "oras"], where: activ(), _count: true }),
    db.proiect.findMany({ where: { activ: true }, select: { slug: true }, orderBy: { id: "desc" } }),
    // Cartierele din ultima fotografie a indicelui, cu destule anunțuri cât pagina să aibă cifre.
    db.indiceLunar.findMany({
      where: { zona: { not: "" }, anunturi: { gte: MIN_ANUNTURI }, actualizat: { gt: new Date(Date.now() - 7 * 864e5) } },
      select: { judet: true, oras: true, zona: true },
      distinct: ["judet", "oras", "zona"],
      take: 20_000,
    }),
  ]);
  // Județele și orașele fără anunțuri au noindex (pagini goale), deci nu le trimitem la Google.
  const cuAnunturi = new Set(peOras.flatMap((r) => [r.judet, `${r.judet}/${r.oras}`]));
  return [
    { url: BAZA },
    { url: `${BAZA}/agentii` },
    { url: `${BAZA}/proiecte` },
    ...proiecte.map((p) => ({ url: `${BAZA}/proiecte/${p.slug}` })),
    { url: `${BAZA}/pentru-agentii` },
    { url: `${BAZA}/pentru-agentii/feed` },
    { url: `${BAZA}/preturi` },
    { url: `${BAZA}/legislatie` },
    { url: `${BAZA}/impozite-locale` },
    { url: `${BAZA}/calculatoare` },
    ...(await citesteImpozite()).map((o) => ({ url: `${BAZA}${caleImpozite(o)}` })),
    { url: `${BAZA}/harta` },
    { url: `${BAZA}/indice-preturi` },
    ...orase.map((o) => ({ url: `${BAZA}/indice-preturi/${o.judet}/${o.oras}` })),
    ...cartiere.map((c) => ({ url: `${BAZA}/indice-preturi/${c.judet}/${c.oras}/${c.zona}` })),
    ...["termeni", "confidentialitate", "anulare-rambursare", "livrare", "retragere", "contact"].map((p) => ({ url: `${BAZA}/${p}` })),
    ...JUDETE.filter((j) => cuAnunturi.has(j.slug)).flatMap((j) => [
      { url: `${BAZA}/${j.slug}` },
      ...j.orase.filter((o) => cuAnunturi.has(`${j.slug}/${o.slug}`)).map((o) => ({ url: `${BAZA}/${j.slug}/${o.slug}` })),
    ]),
    ...anunturi.map((a) => ({ url: `${BAZA}/anunt/${a.id}`, lastModified: a.ordine })),
    ...agentii.map((a) => ({ url: `${BAZA}/agentii/${a.slug}` })),
  ];
}
