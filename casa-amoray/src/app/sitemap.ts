import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/reserveren", "/cadeaubon", "/privacy"].map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "monthly" }));
}
