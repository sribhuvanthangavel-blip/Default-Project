import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/authorize';
import { getAppointmentStats, listAppointments } from '@/lib/db/appointments';
import { getPublicSettings } from '@/lib/db/settings';
import { appointmentReference, formatClinicDate, formatClinicTime } from '@/lib/dates';
import { AppointmentStatusBadge } from '@/components/admin/status-badge';
import { canManageSettings } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const user = await requireStaffPage();
  const [stats, pendingAppointments, settings] = await Promise.all([
    getAppointmentStats(),
    listAppointments({ status: 'pending', page: 1, pageSize: 5 }),
    getPublicSettings(),
  ]);

  const missingContact = !settings.clinicPhone && !settings.clinicEmail && !settings.clinicAddress;
  const cards = [
    {
      label: 'Pending requests',
      value: stats.pending,
      hint: 'Waiting for the clinic to confirm',
      href: '/admin/appointments?status=pending',
      tone: 'emphasis',
    },
    {
      label: 'New messages',
      value: stats.newMessages,
      hint: 'Unread contact enquiries',
      href: '/admin/messages?status=new',
      tone: stats.newMessages > 0 ? 'emphasis' : 'plain',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      hint: 'Booked, not yet completed',
      href: '/admin/appointments?status=confirmed',
      tone: 'plain',
    },
    {
      label: 'Upcoming',
      value: stats.upcoming,
      hint: 'Pending or confirmed, today or later',
      href: '/admin/appointments',
      tone: 'plain',
    },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">
          Overview
        </p>
        <h1 className="mt-2 font-display text-3xl text-forest-950 sm:text-4xl">
          Good to see you{user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Everything here comes from the live database. Requests appear as soon as a visitor submits
          the public form.
        </p>
      </header>

      {missingContact && canManageSettings(user.role) ? (
        <div className="rounded-2xl border border-amber-700/25 bg-amber-100 p-5">
          <p className="text-sm font-semibold text-amber-700">
            The clinic&apos;s contact details are not published yet.
          </p>
          <p className="mt-1 text-[0.82rem] leading-6 text-amber-700/80">
            Phone, address, opening hours and email are blank, so the public site hides them rather
            than showing invented information. Add the verified details in clinic settings.
          </p>
          <Link href="/admin/settings" className="btn-dark btn-sm mt-4">
            Open clinic settings
          </Link>
        </div>
      ) : null}

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`admin-card block p-5 transition hover:-translate-y-0.5 hover:shadow-soft ${
              card.tone === 'emphasis' ? 'border-gold-400/60' : ''
            }`}
          >
            <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-muted uppercase">
              {card.label}
            </p>
            <p className="mt-3 font-display text-4xl text-forest-950">{card.value}</p>
            <p className="mt-2 text-[0.75rem] leading-5 text-muted">{card.hint}</p>
          </Link>
        ))}
      </section>

      <section className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-forest-950">Latest pending requests</h2>
            <p className="mt-1 text-[0.75rem] text-muted">
              These are requests, not confirmed bookings.
            </p>
          </div>
          <Link href="/admin/appointments?status=pending" className="btn-outline btn-sm">
            View all pending
          </Link>
        </div>

        {pendingAppointments.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            Nothing is waiting. New requests will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {pendingAppointments.items.map((appointment) => (
              <li key={appointment.id}>
                <Link
                  href={`/admin/appointments/${appointment.id}`}
                  className="flex flex-col gap-2 px-5 py-4 transition hover:bg-cream-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-forest-950">
                      {appointment.patient_name}
                      <span className="ml-2 font-mono text-[0.68rem] font-normal text-muted">
                        {appointmentReference(appointment.id)}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-[0.78rem] text-muted">
                      {appointment.service?.name ?? 'Service removed'} ·{' '}
                      {formatClinicDate(appointment.preferred_date)} at{' '}
                      {formatClinicTime(appointment.preferred_time)}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="admin-card p-5">
          <h2 className="font-display text-lg text-forest-950">Treatment list</h2>
          <p className="mt-1 text-[0.8rem] leading-6 text-muted">
            {stats.activeServices === 0
              ? 'No services are active, so the appointment form is paused on the public site.'
              : `${stats.activeServices} service${stats.activeServices === 1 ? '' : 's'} visible to visitors.`}
          </p>
          <Link href="/admin/services" className="btn-outline btn-sm mt-4">
            Manage services
          </Link>
        </div>
        <div className="admin-card p-5">
          <h2 className="font-display text-lg text-forest-950">Audit trail</h2>
          <p className="mt-1 text-[0.8rem] leading-6 text-muted">
            Status changes, note edits and configuration updates are recorded with the staff member
            and the time.
          </p>
          <Link href="/admin/audit" className="btn-outline btn-sm mt-4">
            View audit log
          </Link>
        </div>
      </section>

      <p className="text-[0.72rem] leading-6 text-muted">
        Reminder: an appointment is confirmed only after the clinic has spoken to the patient. The
        dashboard is the record of that conversation, not a live diary.
      </p>
    </div>
  );
}
