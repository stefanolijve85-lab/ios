import type { MetadataRoute } from "next";
import { basisUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${basisUrl()}/sitemap.xml`, host: basisUrl() };
}
