import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireStaffPage } from '@/lib/auth/authorize';
import { getAppointmentById } from '@/lib/db/appointments';
import {
  getAllowedTransitions,
  isTerminalStatus,
  STATUS_DESCRIPTIONS,
} from '@/lib/appointments/status';
import {
  appointmentReference,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicTime,
} from '@/lib/dates';
import { AppointmentStatusBadge } from '@/components/admin/status-badge';
import { AppointmentStatusForm } from '@/components/admin/appointment-status-form';
import { AppointmentNotesForm } from '@/components/admin/appointment-notes-form';
import { ArrowLeftIcon, MailIcon, PhoneIcon } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Appointment detail',
  robots: { index: false, follow: false },
};

interface AppointmentDetailProps {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailProps) {
  const user = await requireStaffPage();
  const { id } = await params;

  const appointment = await getAppointmentById(id);
  if (!appointment) notFound();

  const transitions = getAllowedTransitions(appointment.status);
  const reference = appointmentReference(appointment.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/appointments"
          className="inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.12em] text-muted uppercase transition hover:text-forest-900"
        >
          <ArrowLeftIcon className="size-3.5" />
          All appointments
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-forest-950">{appointment.patient_name}</h1>
            <p className="mt-1 font-mono text-[0.75rem] text-muted">{reference}</p>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        <p className="mt-3 max-w-2xl text-[0.82rem] leading-6 text-muted">
          {STATUS_DESCRIPTIONS[appointment.status]}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="admin-card p-5 sm:p-6" aria-labelledby="request-heading">
          <h2 id="request-heading" className="font-display text-xl text-forest-950">
            Request details
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Service
              </dt>
              <dd className="text-forest-900">{appointment.service?.name ?? 'Service removed'}</dd>
            </div>

            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Preferred date
              </dt>
              <dd className="text-forest-900">{formatClinicDate(appointment.preferred_date)}</dd>
            </div>

            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Preferred time
              </dt>
              <dd className="text-forest-900">
                {formatClinicTime(appointment.preferred_time)}
                <span className="ml-2 text-[0.72rem] text-muted">
                  (patient&apos;s request — confirm the actual time with them)
                </span>
              </dd>
            </div>

            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Phone
              </dt>
              <dd className="text-forest-900">
                <a
                  href={`tel:${appointment.phone.replace(/[^+\d]/g, '')}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <PhoneIcon className="size-3.5 text-gold-600" />
                  {appointment.phone}
                </a>
              </dd>
            </div>

            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Email
              </dt>
              <dd className="break-all text-forest-900">
                <a
                  href={`mailto:${appointment.email}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <MailIcon className="size-3.5 shrink-0 text-gold-600" />
                  {appointment.email}
                </a>
              </dd>
            </div>

            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Received
              </dt>
              <dd className="text-forest-900">{formatClinicDateTime(appointment.created_at)}</dd>
            </div>

            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Consent
              </dt>
              <dd className="text-forest-900">
                {appointment.consent_given ? 'Given at submission' : 'Not recorded'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
              Message from the patient
            </h3>
            {appointment.message ? (
              <p className="mt-2 text-sm leading-7 whitespace-pre-line text-forest-900">
                {appointment.message}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">No message was included.</p>
            )}
          </div>
        </section>

        <div className="space-y-5">
          <section className="admin-card p-5 sm:p-6" aria-labelledby="status-heading">
            <h2 id="status-heading" className="font-display text-xl text-forest-950">
              Status
            </h2>
            <p className="mt-1 mb-4 text-[0.78rem] leading-6 text-muted">
              {isTerminalStatus(appointment.status)
                ? 'This request has reached a final state.'
                : 'Move the request through the workflow. The database enforces the same rules.'}
            </p>
            <AppointmentStatusForm id={appointment.id} options={transitions} />
          </section>

          <section className="admin-card p-5 sm:p-6" aria-labelledby="notes-heading">
            <h2 id="notes-heading" className="font-display text-xl text-forest-950">
              Staff notes
            </h2>
            <p className="mt-1 mb-4 text-[0.78rem] leading-6 text-muted">
              Visible only to signed-in staff, and never included in the audit log.
            </p>
            <AppointmentNotesForm id={appointment.id} initialNotes={appointment.admin_notes} />
          </section>

          <p className="text-[0.72rem] leading-6 text-muted">
            Signed in as {user.email} ({user.role}). Every status change and note edit is recorded
            with your account.
          </p>
        </div>
      </div>
    </div>
  );
}
