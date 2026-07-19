import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getAllGuides } from "@/lib/guides";
import { prisma } from "@/lib/prisma";

// 現在會查詢接案頁的 slug 清單，不能再靜態生成——build 環境（CI）沒有正式資料庫連線，
// 一律改成 request-time 渲染，正式站上正常是 Vercel serverless function 即時查詢。
export const dynamic = "force-dynamic";

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
    {
      url: `${siteUrl}/tools/tax-calculator`,
      changeFrequency: "yearly",
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
