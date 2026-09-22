import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The style guide is dev-only and 404s in production, but keep crawlers off it
 * either way.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/design" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
