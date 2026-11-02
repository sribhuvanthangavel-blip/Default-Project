import Link from 'next/link';
import { buildPageHref } from '@/lib/pagination';

interface PaginationProps {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  total,
  pageSize,
}: PaginationProps) {
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[0.75rem] text-muted">
        Showing <span className="font-medium text-forest-900">{first}</span>–
        <span className="font-medium text-forest-900">{last}</span> of{' '}
        <span className="font-medium text-forest-900">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildPageHref(basePath, params, page - 1)}
            className="btn-outline btn-sm"
            rel="prev"
          >
            Previous
          </Link>
        ) : (
          <span className="btn-outline btn-sm pointer-events-none opacity-40" aria-disabled="true">
            Previous
          </span>
        )}

        <span className="text-[0.75rem] text-muted">
          Page {page} of {pageCount}
        </span>

        {page < pageCount ? (
          <Link
            href={buildPageHref(basePath, params, page + 1)}
            className="btn-outline btn-sm"
            rel="next"
          >
            Next
          </Link>
        ) : (
          <span className="btn-outline btn-sm pointer-events-none opacity-40" aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
