import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/cont/", "/admin/", "/api/", "/configurare"] }, sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro"}/sitemap.xml` };
}
