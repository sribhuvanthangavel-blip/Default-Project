import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/auth/authorize';
import { listAuditLogs } from '@/lib/db/audit';
import { parsePage, parsePageSize } from '@/lib/pagination';
import { formatClinicDateTime } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Audit log',
  robots: { index: false, follow: false },
};

const ACTION_LABELS: Record<string, string> = {
  'appointment.status_changed': 'Appointment status changed',
  'appointment.notes_updated': 'Appointment note saved',
  'contact_message.status_changed': 'Message status changed',
  'service.created': 'Service created',
  'service.updated': 'Service updated',
  'service.deleted': 'Service deleted',
  'settings.updated': 'Clinic settings updated',
};

function describeMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '—';
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([key]) => key !== 'by',
  );
  if (entries.length === 0) return '—';
  return entries
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`,
    )
    .join(' · ');
}

interface AuditPageProps {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireAdminPage();

  const params = await searchParams;
  const search = (params.q ?? '').trim().slice(0, 80);
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.pageSize, [20, 50]);

  const result = await listAuditLogs({ search, page, pageSize });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">Audit</p>
        <h1 className="mt-2 font-display text-3xl text-forest-950">Audit log</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          An append-only record of administrative changes. Entries are written by a database
          function, so they cannot be created or edited from the browser. Patient message content
          and appointment notes are never included.
        </p>
      </header>

      <form method="get" className="admin-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <label htmlFor="q" className="admin-label">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Action, resource type or staff email"
            className="admin-input"
          />
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="pageSize" className="admin-label">
            Rows
          </label>
          <select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
            className="admin-input"
          >
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="flex items-end lg:col-span-2">
          <button type="submit" className="btn-dark btn-sm w-full">
            Apply
          </button>
        </div>
      </form>

      <section className="admin-card overflow-hidden">
        {result.items.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-xl text-forest-950">No audit entries yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              {search
                ? 'Nothing matches that search.'
                : 'Entries appear when staff change an appointment, a service or the clinic settings.'}
            </p>
            {search ? (
              <Link href="/admin/audit" className="btn-outline btn-sm mt-5">
                Clear search
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Audit entries</caption>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Action</th>
                  <th scope="col">Resource</th>
                  <th scope="col">Staff</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-[0.72rem] whitespace-nowrap text-muted">
                      {formatClinicDateTime(entry.created_at)}
                    </td>
                    <td className="font-medium text-forest-950">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="text-[0.75rem] text-muted">
                      {entry.resource_type}
                      {entry.resource_id ? (
                        <span className="mt-0.5 block font-mono text-[0.65rem] text-muted/70">
                          {entry.resource_id.slice(0, 8)}…
                        </span>
                      ) : null}
                    </td>
                    <td className="text-[0.75rem] break-all text-muted">
                      {entry.actor_email || '—'}
                    </td>
                    <td className="text-[0.72rem] text-muted">
                      {describeMetadata(entry.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.total > 0 ? (
          <nav
            aria-label="Pagination"
            className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-[0.75rem] text-muted">
              Page {result.page} of {result.pageCount} · {result.total} entries
            </p>
            <div className="flex items-center gap-2">
              {result.page > 1 ? (
                <Link
                  href={`/admin/audit?${new URLSearchParams({
                    ...(search ? { q: search } : {}),
                    pageSize: String(pageSize),
                    page: String(result.page - 1),
                  }).toString()}`}
                  className="btn-outline btn-sm"
                  rel="prev"
                >
                  Previous
                </Link>
              ) : null}
              {result.page < result.pageCount ? (
                <Link
                  href={`/admin/audit?${new URLSearchParams({
                    ...(search ? { q: search } : {}),
                    pageSize: String(pageSize),
                    page: String(result.page + 1),
                  }).toString()}`}
                  className="btn-outline btn-sm"
                  rel="next"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
