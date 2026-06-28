import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  buildHref: (page: number) => string;
}

export function Pagination({ currentPage, totalCount, pageSize, buildHref }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      <span className="text-foreground-muted">
        共 {totalCount} 筆，第 {currentPage} / {totalPages} 頁
      </span>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="px-3 py-1.5 border border-border rounded-md hover:bg-surface transition-colors"
          >
            上一頁
          </Link>
        ) : (
          <span className="px-3 py-1.5 border border-border rounded-md text-foreground-muted opacity-40 cursor-not-allowed">
            上一頁
          </span>
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="px-3 py-1.5 border border-border rounded-md hover:bg-surface transition-colors"
          >
            下一頁
          </Link>
        ) : (
          <span className="px-3 py-1.5 border border-border rounded-md text-foreground-muted opacity-40 cursor-not-allowed">
            下一頁
          </span>
        )}
      </div>
    </div>
  );
}
