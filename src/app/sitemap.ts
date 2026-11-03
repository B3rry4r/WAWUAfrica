import type { MetadataRoute } from "next";
import { SITE_PAGES, SITE_URL } from "@/lib/site/site-config";

/**
 * /sitemap.xml: the pages of the brand site (BRAND-SITE, owner 2 Nov 2026).
 * Join-only mode serves it next to /robots.txt (src/lib/site-mode.ts). The
 * base address is the deployment's own, as in the root layout's metadataBase.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL).replace(/\/+$/, "");
  return SITE_PAGES.map((page, index) => ({
    url: page.href === "/" ? `${base}/` : `${base}${page.href}`,
    changeFrequency: "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
