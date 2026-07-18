import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatDate } from "@/lib/currency";
import { Pagination } from "@/components/Pagination";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { createQuoteFromInquiryAction, deleteInquiryAction } from "./actions";

const PAGE_SIZE = 30;

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const userId = await requireUserId();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = { userId };
  const [inquiries, totalCount, profile] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.inquiry.count({ where }),
    prisma.profile.findUnique({ where: { id: userId }, select: { slug: true } }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-4xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">詢價</h1>
        <Link href="/settings" className="text-sm text-foreground-muted hover:text-foreground">
          接案頁設定
        </Link>
      </div>

      {!profile?.slug && (
        <p className="text-sm text-foreground-muted mb-6">
          你還沒設定接案頁網址，去
          <Link href="/settings" className="text-accent hover:underline mx-1">
            設定
          </Link>
          開通後就能開始收詢價。
        </p>
      )}

      {totalCount === 0 ? (
        <p className="text-sm text-foreground-muted py-12 text-center">
          還沒有收到詢價。
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {inquiries.map((inquiry) => {
              const newClientHref = `/clients/new?${new URLSearchParams({
                name: inquiry.name,
                contact: inquiry.contact,
              })}`;
              const deleteAction = deleteInquiryAction.bind(null, inquiry.id);
              const createQuoteAction = createQuoteFromInquiryAction.bind(null, inquiry.id);
              return (
                <div key={inquiry.id} className="border border-border rounded-lg px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <p className="text-sm font-medium">{inquiry.name}</p>
                    <p className="text-xs text-foreground-muted shrink-0">
                      {formatDate(inquiry.createdAt)}
                    </p>
                  </div>
                  <p className="text-xs text-foreground-muted mb-2">{inquiry.contact}</p>
                  <p className="text-sm whitespace-pre-wrap mb-3">{inquiry.message}</p>
                  <div className="flex items-center gap-3">
                    <form action={createQuoteAction}>
                      <button type="submit" className="text-sm text-accent hover:underline cursor-pointer">
                        開報價單 →
                      </button>
                    </form>
                    <Link href={newClientHref} className="text-sm text-foreground-muted hover:text-foreground">
                      新增為客戶
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteAction}
                      confirmMessage="確定要刪除這筆詢價嗎？此操作無法復原。"
                      successMessage="已刪除"
                      label="刪除"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            buildHref={(p) => `/inquiries${p > 1 ? `?page=${p}` : ""}`}
          />
        </>
      )}
    </div>
  );
}
