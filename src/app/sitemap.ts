import type { MetadataRoute } from "next";
import { JUDETE } from "@/lib/geo";
import { getAgentii } from "@/lib/utilizatori";

const BAZA = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.ro";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BAZA },
    { url: `${BAZA}/agentii` },
    ...JUDETE.flatMap((j) => [{ url: `${BAZA}/${j.slug}` }, ...j.orase.map((o) => ({ url: `${BAZA}/${j.slug}/${o.slug}` }))]),
    ...getAgentii().map((a) => ({ url: `${BAZA}/agentii/${a.slug}` })),
  ];
}
