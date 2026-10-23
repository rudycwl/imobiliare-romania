import type { MetadataRoute } from "next";
import { JUDETE } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";
import { indiceOrase } from "@/lib/indice";

const BAZA = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agentii, orase] = await Promise.all([getAgentii(), indiceOrase()]);
  return [
    { url: BAZA },
    { url: `${BAZA}/agentii` },
    { url: `${BAZA}/pentru-agentii` },
    { url: `${BAZA}/preturi` },
    { url: `${BAZA}/legislatie` },
    { url: `${BAZA}/harta` },
    { url: `${BAZA}/indice-preturi` },
    ...orase.map((o) => ({ url: `${BAZA}/indice-preturi/${o.judet}/${o.oras}` })),
    ...["termeni", "confidentialitate", "anulare-rambursare", "livrare", "retragere", "contact"].map((p) => ({ url: `${BAZA}/${p}` })),
    ...JUDETE.flatMap((j) => [{ url: `${BAZA}/${j.slug}` }, ...j.orase.map((o) => ({ url: `${BAZA}/${j.slug}/${o.slug}` }))]),
    ...agentii.map((a) => ({ url: `${BAZA}/agentii/${a.slug}` })),
  ];
}
