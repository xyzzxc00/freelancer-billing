import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getAllGuides } from "@/lib/guides";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [guides, publicProfiles] = await Promise.all([
    getAllGuides(),
    prisma.profile.findMany({ where: { slug: { not: null } }, select: { slug: true } }),
  ]);

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
    ...publicProfiles.map((p) => ({
      url: `${siteUrl}/p/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
