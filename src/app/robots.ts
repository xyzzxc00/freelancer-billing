import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/clients", "/expenses", "/income", "/quotes", "/quote/", "/receivables", "/reports", "/settings", "/api", "/forgot-password", "/reset-password", "/inquiries", "/transactions", "/feedback"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
