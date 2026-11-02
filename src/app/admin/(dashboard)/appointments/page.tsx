import Link from 'next/link';
import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/authorize';
import { listAppointments } from '@/lib/db/appointments';
import { APPOINTMENT_STATUSES, STATUS_LABELS } from '@/lib/appointments/status';
import { DEFAULT_PAGE_SIZE, APPOINTMENT_PAGE_SIZES } from '@/lib/db/types';
import { parseDateParam, parsePage, parsePageSize } from '@/lib/pagination';
import { appointmentReference, formatClinicDate, formatClinicTime } from '@/lib/dates';
import { AppointmentStatusBadge } from '@/components/admin/status-badge';
import { Pagination } from '@/components/admin/pagination';
import type { AppointmentStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Appointments',
  robots: { index: false, follow: false },
};

interface AppointmentsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
}

function isStatus(value: string | undefined): value is AppointmentStatus {
  return Boolean(value) && APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  await requireStaffPage();

  const params = await searchParams;
  const search = (params.q ?? '').trim().slice(0, 80);
  const status = isStatus(params.status) ? params.status : 'all';
  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.pageSize, APPOINTMENT_PAGE_SIZES);

  const result = await listAppointments({ search, status, from, to, page, pageSize });
  const hasFilters = Boolean(search || status !== 'all' || from || to);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">
            Appointments
          </p>
          <h1 className="mt-2 font-display text-3xl text-forest-950">Requests &amp; bookings</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Every row is a request until a staff member confirms it.
          </p>
        </div>
        <p className="text-[0.78rem] text-muted">
          {result.total} record{result.total === 1 ? '' : 's'}
          {hasFilters ? ' matching the filters' : ''}
        </p>
      </header>

      <form method="get" className="admin-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <label htmlFor="q" className="admin-label">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Name, email or phone"
            className="admin-input"
          />
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="status" className="admin-label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="admin-input">
            <option value="all">All</option>
            {APPOINTMENT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="from" className="admin-label">
            Preferred from
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from ?? ''}
            className="admin-input"
          />
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="to" className="admin-label">
            Preferred to
          </label>
          <input id="to" name="to" type="date" defaultValue={to ?? ''} className="admin-input" />
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="pageSize" className="admin-label">
            Rows
          </label>
          <select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
            className="admin-input"
          >
            {APPOINTMENT_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 lg:col-span-1">
          <button type="submit" className="btn-dark btn-sm w-full">
            Apply
          </button>
        </div>

        {hasFilters ? (
          <p className="text-[0.72rem] text-muted lg:col-span-12">
            <Link href="/admin/appointments" className="link-underline">
              Clear all filters
            </Link>
          </p>
        ) : null}
      </form>

      <section className="admin-card overflow-hidden">
        {result.items.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-xl text-forest-950">No appointments found.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              {hasFilters
                ? 'Try a different search term or clear the filters.'
                : 'New requests from the public website will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Appointment requests</caption>
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Service</th>
                  <th scope="col">Preferred</th>
                  <th scope="col">Status</th>
                  <th scope="col">Received</th>
                  <th scope="col">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <p className="font-medium text-forest-950">{appointment.patient_name}</p>
                      <p className="mt-0.5 font-mono text-[0.68rem] text-muted">
                        {appointmentReference(appointment.id)}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] text-muted">{appointment.phone}</p>
                    </td>
                    <td className="text-muted">{appointment.service?.name ?? '—'}</td>
                    <td>
                      <p className="text-forest-900">
                        {formatClinicDate(appointment.preferred_date)}
                      </p>
                      <p className="text-[0.72rem] text-muted">
                        {formatClinicTime(appointment.preferred_time)}
                      </p>
                    </td>
                    <td>
                      <AppointmentStatusBadge status={appointment.status} />
                    </td>
                    <td className="text-[0.75rem] whitespace-nowrap text-muted">
                      {formatClinicDate(appointment.created_at.slice(0, 10))}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/appointments/${appointment.id}`}
                        className="text-[0.72rem] font-semibold tracking-[0.1em] text-forest-800 uppercase hover:text-forest-600"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          basePath="/admin/appointments"
          params={{
            q: search || undefined,
            status: status === 'all' ? undefined : status,
            from,
            to,
            pageSize: pageSize === DEFAULT_PAGE_SIZE ? undefined : String(pageSize),
          }}
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
        />
      </section>
    </div>
  );
}
