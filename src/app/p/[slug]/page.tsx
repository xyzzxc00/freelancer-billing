import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
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
    select: { name: true, email: true, bio: true },
  });
  if (!profile) return {};

  const displayName = profile.name ?? profile.email;
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
    select: { name: true, email: true, bio: true, services: true },
  });

  if (!profile) {
    notFound();
  }

  const displayName = profile.name ?? profile.email;
  const inquiryAction = submitInquiryAction.bind(null, slug);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
        </div>
      </div>
    </div>
  );
}
