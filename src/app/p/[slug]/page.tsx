import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { siteUrl, siteName } from "@/lib/site";
import { InquiryForm } from "@/components/InquiryForm";
import { submitInquiryAction } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.profile.findUnique({
    where: { slug },
    select: { name: true, bio: true },
  });
  if (!profile) return {};

  // 沒設顯示名稱時退回 slug，絕不能把登入 email 放上公開頁
  const displayName = profile.name ?? slug;
  const description = profile.bio?.slice(0, 150) || `${displayName} 的接案服務介紹與詢價`;

  return {
    title: `${displayName} - 接案服務`,
    description,
    alternates: { canonical: `${siteUrl}/p/${slug}` },
    openGraph: {
      type: "website",
      title: `${displayName} - 接案服務`,
      description,
      url: `${siteUrl}/p/${slug}`,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await prisma.profile.findUnique({
    where: { slug },
    select: { name: true, bio: true, services: true },
  });

  if (!profile) {
    notFound();
  }

  const displayName = profile.name ?? slug;
  const inquiryAction = submitInquiryAction.bind(null, slug);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${siteUrl}/p/${slug}`,
    mainEntity: {
      "@type": "Person",
      name: displayName,
      url: `${siteUrl}/p/${slug}`,
      ...(profile.bio ? { description: profile.bio } : {}),
      ...(profile.services ? { knowsAbout: profile.services } : {}),
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* bio/services 是使用者輸入，轉義 < 防止 </script> 跳脫 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex-1 flex justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 pt-10 pb-8 border-b border-gray-100">
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">{displayName}</h1>
              {profile.bio && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {profile.services && (
              <div className="px-8 py-6 border-b border-gray-100">
                <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                  服務項目
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {profile.services}
                </p>
              </div>
            )}

            <div className="px-8 py-8">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
                聯絡 {displayName}
              </p>
              <InquiryForm action={inquiryAction} />
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            用{" "}
            <Link href="/" className="text-gray-500 hover:text-gray-700 underline">
              {siteName}
            </Link>{" "}
            打造你的接案頁
          </p>
        </div>
      </div>
    </div>
  );
}
