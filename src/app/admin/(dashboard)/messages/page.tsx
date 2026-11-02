import Link from 'next/link';
import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/authorize';
import { listContactMessages } from '@/lib/db/messages';
import { parsePage, parsePageSize } from '@/lib/pagination';
import { formatClinicDateTime } from '@/lib/dates';
import { MessageStatusBadge } from '@/components/admin/status-badge';
import { MessageStatusActions } from '@/components/admin/message-status-actions';
import { Pagination } from '@/components/admin/pagination';
import type { ContactMessageStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
};

const STATUSES: ContactMessageStatus[] = ['new', 'read', 'archived'];

interface MessagesPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string; pageSize?: string }>;
}

function isStatus(value: string | undefined): value is ContactMessageStatus {
  return Boolean(value) && STATUSES.includes(value as ContactMessageStatus);
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  await requireStaffPage();

  const params = await searchParams;
  const search = (params.q ?? '').trim().slice(0, 80);
  const status = isStatus(params.status) ? params.status : 'all';
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.pageSize);
  const hasFilters = Boolean(search || status !== 'all');

  const result = await listContactMessages({ search, status, page, pageSize });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">
            Messages
          </p>
          <h1 className="mt-2 font-display text-3xl text-forest-950">Contact enquiries</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sent through the public contact form. Reply directly to the sender.
          </p>
        </div>
        <p className="text-[0.78rem] text-muted">
          {result.total} message{result.total === 1 ? '' : 's'}
        </p>
      </header>

      <form method="get" className="admin-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <label htmlFor="q" className="admin-label">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Name, email or message text"
            className="admin-input"
          />
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="status" className="admin-label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="admin-input">
            <option value="all">All</option>
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option[0]?.toUpperCase()}
                {option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="pageSize" className="admin-label">
            Rows
          </label>
          <select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
            className="admin-input"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end lg:col-span-1">
          <button type="submit" className="btn-dark btn-sm w-full">
            Apply
          </button>
        </div>

        {hasFilters ? (
          <p className="text-[0.72rem] text-muted lg:col-span-12">
            <Link href="/admin/messages" className="link-underline">
              Clear all filters
            </Link>
          </p>
        ) : null}
      </form>

      {result.items.length === 0 ? (
        <div className="admin-card px-5 py-14 text-center">
          <p className="font-display text-xl text-forest-950">No messages found.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            {hasFilters
              ? 'Try a different search term or clear the filters.'
              : 'Messages sent through the contact form will appear here.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {result.items.map((message) => (
            <li key={message.id} className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-forest-950">{message.name}</p>
                  <p className="mt-1 text-[0.78rem] break-all text-muted">
                    <a href={`mailto:${message.email}`} className="hover:underline">
                      {message.email}
                    </a>
                    {message.phone ? (
                      <>
                        {' · '}
                        <a
                          href={`tel:${message.phone.replace(/[^+\d]/g, '')}`}
                          className="hover:underline"
                        >
                          {message.phone}
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <MessageStatusBadge status={message.status} />
                  <time
                    dateTime={message.created_at}
                    className="text-[0.7rem] whitespace-nowrap text-muted"
                  >
                    {formatClinicDateTime(message.created_at)}
                  </time>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 whitespace-pre-line text-forest-900">
                {message.message}
              </p>

              <div className="mt-5 border-t border-line pt-4">
                <MessageStatusActions id={message.id} current={message.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {result.items.length > 0 ? (
        <section className="admin-card overflow-hidden">
          <Pagination
            basePath="/admin/messages"
            params={{
              q: search || undefined,
              status: status === 'all' ? undefined : status,
              pageSize: String(pageSize),
            }}
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
          />
        </section>
      ) : null}
    </div>
  );
}
