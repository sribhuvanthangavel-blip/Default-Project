import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSettings } from '@/lib/db/settings';
import { listPublicServices } from '@/lib/db/services';
import { getClinicTimeZone } from '@/lib/env';
import { todayInTimeZone } from '@/lib/dates';
import { telHref } from '@/lib/settings';
import { PageHero } from '@/components/site/page-hero';
import { AppointmentForm } from '@/components/forms/appointment-form';
import { CheckIcon, ClockIcon, PhoneIcon, ShieldIcon } from '@/components/ui/icons';
import { THINGS_TO_KNOW } from '@/content/site';

export const metadata: Metadata = {
  title: 'Request an appointment',
  description:
    'Request an appointment at Jishnu\u2019s Dentistry. Choose a service, preferred date and time, and the clinic will confirm the details with you directly.',
  alternates: { canonical: '/appointment' },
};

interface AppointmentPageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  const [services, settings, resolvedParams] = await Promise.all([
    listPublicServices(),
    getPublicSettings(),
    searchParams,
  ]);

  const timeZone = getClinicTimeZone();
  const minDate = todayInTimeZone(timeZone);
  const requestedSlug = resolvedParams.service?.trim();
  const defaultService = requestedSlug
    ? services.find((service) => service.slug === requestedSlug)
    : undefined;

  const phone = telHref(settings.clinicPhone);
  const bookingEnabled = settings.bookingEnabled && services.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Request an appointment."
        body="Send a request and the clinic will review it, then contact you to confirm the date and time. No account, no payment and no obligation."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Appointments' }]}
        aside={
          <div className="max-w-xs rounded-card border border-gold-400/30 bg-cream-50 p-6">
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-700 uppercase">
              Before you send
            </p>
            <ul className="mt-4 space-y-3">
              {THINGS_TO_KNOW.map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.82rem] leading-6 text-muted">
                  <CheckIcon className="mt-1 size-3.5 shrink-0 text-gold-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            {!bookingEnabled ? (
              <div
                className="rounded-card border border-amber-700/25 bg-amber-100 p-7 sm:p-9"
                role="status"
              >
                <ClockIcon className="size-6 text-amber-700" />
                <h2 className="mt-5 font-display text-3xl text-forest-950">
                  Online requests are paused.
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {services.length === 0
                    ? 'The clinic is preparing its treatment list and is not taking online requests at the moment.'
                    : 'The clinic has paused online appointment requests for now.'}{' '}
                  Please contact the clinic directly and they will arrange a time with you.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {phone ? (
                    <a href={phone} className="btn-dark btn-sm">
                      <PhoneIcon className="size-4" />
                      {settings.clinicPhone}
                    </a>
                  ) : null}
                  <Link href="/contact" className="btn-outline btn-sm">
                    Send an enquiry
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-card border border-line bg-cream-50 p-6 sm:p-9">
                <h2 className="font-display text-3xl text-forest-950">Appointment request</h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Fields marked <span className="text-clay-700">*</span> are required.
                </p>
                <div className="mt-7">
                  <AppointmentForm
                    services={services.map((service) => ({ id: service.id, name: service.name }))}
                    minDate={minDate}
                    timeZone={timeZone}
                    defaultServiceId={defaultService?.id ?? services[0]?.id}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-card border border-line bg-cream-100/70 p-7">
              <h2 className="font-display text-2xl text-forest-950">What happens next</h2>
              <ol className="mt-5 space-y-5">
                {[
                  {
                    title: 'The clinic reviews your request',
                    body: 'Staff read every request. Nothing is auto-confirmed by the website.',
                  },
                  {
                    title: 'You are contacted directly',
                    body: 'The clinic gets in touch using the phone number or email you provide.',
                  },
                  {
                    title: 'The time is confirmed',
                    body: 'Only then is the appointment confirmed. If the time does not suit you, say so.',
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gold-400/60 text-[0.65rem] font-semibold text-gold-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-forest-900">{step.title}</p>
                      <p className="mt-1 text-[0.82rem] leading-6 text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-card border border-line bg-cream-50 p-7">
              <div className="flex gap-3">
                <ShieldIcon className="mt-0.5 size-5 shrink-0 text-gold-700" />
                <div>
                  <h2 className="text-sm font-semibold text-forest-900">Your information</h2>
                  <p className="mt-2 text-[0.82rem] leading-6 text-muted">
                    Only what is needed to arrange the appointment is collected. It is visible to
                    clinic staff, protected by database access rules and recorded in an audit trail
                    when staff change an appointment.
                  </p>
                  <Link
                    href="/privacy"
                    className="mt-3 inline-flex text-[0.82rem] font-semibold text-forest-800 underline decoration-gold-400 underline-offset-4"
                  >
                    Read the privacy policy
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-amber-700/25 bg-amber-100 p-7">
              <h2 className="text-sm font-semibold text-amber-700">Not for emergencies</h2>
              <p className="mt-2 text-[0.82rem] leading-6 text-amber-700/80">
                This form is not monitored around the clock. If you have an urgent dental concern,
                contact the clinic directly or seek appropriate urgent medical care.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
