import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: [{ userAgent: "*", disallow: "/" }] }; // testversie: niet indexeren
  return { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], sitemap: `${siteUrl}/sitemap.xml` };
}
