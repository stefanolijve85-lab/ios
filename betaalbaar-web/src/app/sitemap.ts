import type { MetadataRoute } from "next";
import { brand, projects, flags } from "@/config/site";

/** Alleen echte openbare content; concept-juridische pagina's, intake en beheer staan er niet in. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!flags.indexable) return [];
  const paths = ["/", "/website-laten-maken", "/prijzen", "/voorbeelden", "/werkwijze", "/contact", ...projects.map((p) => `/voorbeelden/${p.slug}`)];
  return paths.map((p) => ({ url: brand.url + p }));
}
