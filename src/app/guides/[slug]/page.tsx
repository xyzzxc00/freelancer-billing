import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllGuides, getGuide } from "@/lib/guides";
import { siteName, siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { ShareRow } from "@/components/ShareRow";

export async function generateStaticParams() {
  const guides = await getAllGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `${siteUrl}/guides/${slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${siteUrl}/guides/${slug}`,
      publishedTime: guide.date || undefined,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [guide, allGuides, supabase] = await Promise.all([
    getGuide(slug),
    getAllGuides(),
    createClient(),
  ]);
  if (!guide) notFound();
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  const others = allGuides.filter((g) => g.slug !== slug);
  const curated = guide.related
    .map((s) => others.find((g) => g.slug === s))
    .filter((g): g is (typeof others)[number] => Boolean(g));
  const relatedGuides = (curated.length > 0 ? curated : others).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.date || undefined,
    dateModified: guide.date || undefined,
    author: { "@type": "Organization", name: siteName },
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: `${siteUrl}/guides/${slug}`,
  };

  return (
    <div className="flex flex-col flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <Link href="/" className="text-base font-medium">
          接案帳本
        </Link>
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-surface"
          >
            返回總覽
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            登入
          </Link>
        )}
      </header>

      <article className="px-4 sm:px-6 py-10 max-w-2xl w-full mx-auto">
        <Link
          href="/guides"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          ← 知識庫
        </Link>
        <h1 className="text-2xl sm:text-3xl font-medium mt-4 mb-2 leading-snug">
          {guide.title}
        </h1>
        {guide.date && (
          <p className="text-sm text-foreground-muted mb-8">{guide.date}</p>
        )}

        <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="text-xl font-medium mt-6 mb-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium mt-4 mb-1">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-foreground-muted">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-foreground-muted">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-foreground-muted">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => (
                <strong className="font-medium text-foreground">{children}</strong>
              ),
              a: ({ href, children }) => (
                <Link
                  href={href ?? "#"}
                  className="text-accent hover:underline"
                >
                  {children}
                </Link>
              ),
            }}
          >
            {guide.content}
          </ReactMarkdown>
        </div>

        <div className="border-t border-border mt-10 pt-6">
          <p className="text-sm text-foreground-muted mb-3">
            想把報價、記帳、追款都管在一個地方？
          </p>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-block bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium"
            >
              返回總覽
            </Link>
          ) : (
            <Link
              href="/login?mode=signup"
              className="inline-block bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium"
            >
              免費開始使用接案帳本
            </Link>
          )}
        </div>

        <div className="border-t border-border mt-6 pt-6">
          <ShareRow url={`${siteUrl}/guides/${slug}`} title={guide.title} />
        </div>

        {relatedGuides.length > 0 && (
          <div className="border-t border-border mt-8 pt-6">
            <h2 className="text-base font-medium mb-3">延伸閱讀</h2>
            <div className="flex flex-col gap-3">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="block border border-border rounded-lg p-4 hover:bg-surface transition-colors"
                >
                  <p className="text-sm font-medium">{g.title}</p>
                  <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                    {g.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

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
