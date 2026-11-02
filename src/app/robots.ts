import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/site-config";

/** /robots.txt: crawlers may read the public pages, not the admin pages or the API, and are pointed at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL).replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
