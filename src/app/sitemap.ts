import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getAllGuides } from "@/lib/guides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guides = await getAllGuides();

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...guides.map((g) => ({
      url: `${siteUrl}/guides/${g.slug}`,
      lastModified: g.date || undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/login`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
