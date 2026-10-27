import type { MetadataRoute } from "next";
import { JUDETE } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";
import { indiceOrase } from "@/lib/indice";
import { activ } from "@/lib/anunturi";
import { db } from "@/lib/db";
import { caleImpozite } from "@/lib/impozite-locale";
import { citesteImpozite } from "@/lib/continut-db";

const BAZA = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agentii, orase, anunturi, peOras] = await Promise.all([
    getAgentii(),
    indiceOrase(),
    db.anunt.findMany({ where: activ(), select: { id: true, ordine: true }, orderBy: { id: "desc" }, take: 45_000 }),
    db.anunt.groupBy({ by: ["judet", "oras"], where: activ(), _count: true }),
  ]);
  // Județele și orașele fără anunțuri au noindex (pagini goale), deci nu le trimitem la Google.
  const cuAnunturi = new Set(peOras.flatMap((r) => [r.judet, `${r.judet}/${r.oras}`]));
  return [
    { url: BAZA },
    { url: `${BAZA}/agentii` },
    { url: `${BAZA}/pentru-agentii` },
    { url: `${BAZA}/preturi` },
    { url: `${BAZA}/legislatie` },
    { url: `${BAZA}/impozite-locale` },
    { url: `${BAZA}/calculatoare` },
    ...(await citesteImpozite()).map((o) => ({ url: `${BAZA}${caleImpozite(o)}` })),
    { url: `${BAZA}/harta` },
    { url: `${BAZA}/indice-preturi` },
    ...orase.map((o) => ({ url: `${BAZA}/indice-preturi/${o.judet}/${o.oras}` })),
    ...["termeni", "confidentialitate", "anulare-rambursare", "livrare", "retragere", "contact"].map((p) => ({ url: `${BAZA}/${p}` })),
    ...JUDETE.filter((j) => cuAnunturi.has(j.slug)).flatMap((j) => [
      { url: `${BAZA}/${j.slug}` },
      ...j.orase.filter((o) => cuAnunturi.has(`${j.slug}/${o.slug}`)).map((o) => ({ url: `${BAZA}/${j.slug}/${o.slug}` })),
    ]),
    ...anunturi.map((a) => ({ url: `${BAZA}/anunt/${a.id}`, lastModified: a.ordine })),
    ...agentii.map((a) => ({ url: `${BAZA}/agentii/${a.slug}` })),
  ];
}
