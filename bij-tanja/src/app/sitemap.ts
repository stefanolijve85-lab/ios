import type { MetadataRoute } from "next";
import { basisUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = basisUrl();
  return [
    { pad: "/", prio: 1 },
    { pad: "/assortiment", prio: 0.9 },
    { pad: "/cadeaus", prio: 0.8 },
    { pad: "/over-tanja", prio: 0.7 },
    { pad: "/contact", prio: 0.9 },
  ].map(({ pad, prio }) => ({ url: base + pad, lastModified: new Date(), changeFrequency: "monthly", priority: prio }));
}
