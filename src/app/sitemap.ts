import type { MetadataRoute } from "next";
import { JUDETE } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";

const BAZA = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agentii = await getAgentii();
  return [
    { url: BAZA },
    { url: `${BAZA}/agentii` },
    ...JUDETE.flatMap((j) => [{ url: `${BAZA}/${j.slug}` }, ...j.orase.map((o) => ({ url: `${BAZA}/${j.slug}/${o.slug}` }))]),
    ...agentii.map((a) => ({ url: `${BAZA}/agentii/${a.slug}` })),
  ];
}
