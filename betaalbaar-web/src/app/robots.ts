import type { MetadataRoute } from "next";
import { brand, flags } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (!flags.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/start", "/beheer", "/api/", "/privacy", "/voorwaarden"] },
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
