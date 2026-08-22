import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuides } from "@/lib/guides";
import { siteName, siteUrl } from "@/lib/site";
import { AuthNavButton } from "@/components/AuthNavButton";

export const metadata: Metadata = {
  title: "接案知識庫 — 報價、記帳、接案實用指南",
  description:
    "給自由接案者與小型工作室的實用指南：報價單怎麼開、接案怎麼記帳、待收款怎麼追，幫你把接案的金流管理得更輕鬆。",
  alternates: {
    canonical: `${siteUrl}/guides`,
  },
};

export default async function GuidesPage() {
  const guides = await getAllGuides();

  // CollectionPage + ItemList：讓搜尋引擎知道這是文章列表頁，以及涵蓋哪些文章
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "接案知識庫",
    description: "報價、記帳、追款——把接案會遇到的金流問題講清楚。",
    url: `${siteUrl}/guides`,
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: guides.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: `${siteUrl}/guides/${g.slug}`,
      })),
    },
  };

  return (
    <div className="flex flex-col flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <Link href="/" className="text-base font-medium">
          接案帳本
        </Link>
        <AuthNavButton />
      </header>

      <section className="px-4 sm:px-6 py-12 max-w-3xl w-full mx-auto">
        <h1 className="text-2xl sm:text-3xl font-medium mb-2">接案知識庫</h1>
        <p className="text-foreground-muted mb-10 leading-relaxed">
          報價、記帳、追款——把接案會遇到的金流問題講清楚。
        </p>

        {guides.length === 0 ? (
          <p className="text-sm text-foreground-muted">文章準備中，敬請期待。</p>
        ) : (
          <div className="flex flex-col gap-6">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="block border border-border rounded-lg p-5 hover:bg-surface transition-colors"
              >
                <h2 className="text-lg font-medium mb-1.5">{guide.title}</h2>
                <p className="text-sm text-foreground-muted leading-relaxed mb-2">
                  {guide.description}
                </p>
                {guide.date && (
                  <p className="text-xs text-foreground-muted">{guide.date}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="px-4 sm:px-6 py-8 border-t border-border flex justify-between items-center text-sm text-foreground-muted mt-auto">
        <Link href="/" className="hover:text-foreground">
          接案帳本
        </Link>
        <Link href="/privacy?from=home" className="hover:text-foreground">
          隱私權政策
        </Link>
      </footer>
    </div>
  );
}
