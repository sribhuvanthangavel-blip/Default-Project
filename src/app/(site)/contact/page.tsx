import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_COPY } from '@/content/site';
import { getPublicSettings } from '@/lib/db/settings';
import { mailtoHref, telHref, whatsappHref } from '@/lib/settings';
import { PageHero } from '@/components/site/page-hero';
import { ContactForm } from '@/components/forms/contact-form';
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Jishnu\u2019s Dentistry. Send an enquiry and the clinic will respond directly, or call using the published phone number.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const settings = await getPublicSettings();

  const phone = telHref(settings.clinicPhone);
  const email = mailtoHref(settings.clinicEmail);
  const whatsapp = whatsappHref(settings.clinicWhatsapp);
  const hasDirectContact = Boolean(phone || email || whatsapp || settings.clinicAddress);

  return (
    <>
      <PageHero
        eyebrow={CONTACT_COPY.eyebrow}
        title={CONTACT_COPY.title}
        body={CONTACT_COPY.body}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="rounded-card border border-line bg-cream-50 p-6 sm:p-9">
              <h2 className="font-display text-3xl text-forest-950">Send an enquiry</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                The clinic will reply using the details you provide. Please avoid sensitive medical
                information.
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-card border border-line bg-cream-50 p-7">
              <h2 className="font-display text-2xl text-forest-950">Clinic details</h2>

              {hasDirectContact ? (
                <dl className="mt-6 space-y-5">
                  {phone ? (
                    <div className="flex gap-3">
                      <PhoneIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                      <div>
                        <dt className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-forest-900">
                          <a href={phone} className="link-underline">
                            {settings.clinicPhone}
                          </a>
                        </dd>
                      </div>
                    </div>
                  ) : null}

                  {whatsapp ? (
                    <div className="flex gap-3">
                      <WhatsAppIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                      <div>
                        <dt className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
                          WhatsApp
                        </dt>
                        <dd className="mt-1 text-sm text-forest-900">
                          <a
                            href={whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-underline"
                          >
                            Message the clinic
                          </a>
                        </dd>
                      </div>
                    </div>
                  ) : null}

                  {email ? (
                    <div className="flex gap-3">
                      <MailIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                      <div>
                        <dt className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm break-all text-forest-900">
                          <a href={email} className="link-underline">
                            {settings.clinicEmail}
                          </a>
                        </dd>
                      </div>
                    </div>
                  ) : null}

                  {settings.clinicAddress ? (
                    <div className="flex gap-3">
                      <MapPinIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                      <div>
                        <dt className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
                          Address
                        </dt>
                        <dd className="mt-1 text-sm leading-6 whitespace-pre-line text-forest-900">
                          {settings.clinicAddress}
                        </dd>
                      </div>
                    </div>
                  ) : null}

                  {settings.clinicHours ? (
                    <div className="flex gap-3">
                      <ClockIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                      <div>
                        <dt className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
                          Opening hours
                        </dt>
                        <dd className="mt-1 text-sm leading-6 whitespace-pre-line text-forest-900">
                          {settings.clinicHours}
                        </dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <div className="mt-5">
                  <p className="text-sm leading-7 text-muted">
                    Direct contact details are being confirmed by the clinic and will be published
                    here once verified. The enquiry form is the fastest way to reach them in the
                    meantime.
                  </p>
                  <Link href="/appointment" className="btn-dark btn-sm mt-5">
                    Request an appointment
                  </Link>
                </div>
              )}

              {settings.clinicMapUrl ? (
                <a
                  href={settings.clinicMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex text-sm font-semibold text-forest-800 underline decoration-gold-400 underline-offset-4"
                >
                  Open the location in maps
                </a>
              ) : null}
            </div>

            <div className="rounded-card border border-amber-700/25 bg-amber-100 p-7">
              <h2 className="text-sm font-semibold text-amber-700">Urgent concerns</h2>
              <p className="mt-2 text-[0.82rem] leading-6 text-amber-700/80">
                This website is not an emergency service and enquiries are not monitored around the
                clock. If you need urgent help, contact the clinic by phone or seek appropriate
                urgent medical care.
              </p>
            </div>

            <div className="rounded-card border border-line bg-cream-100/70 p-7">
              <h2 className="text-sm font-semibold text-forest-900">Booking instead?</h2>
              <p className="mt-2 text-[0.82rem] leading-6 text-muted">
                Appointment requests have their own form, which includes your preferred date and
                time so the clinic can confirm it with you.
              </p>
              <Link href="/appointment" className="btn-outline btn-sm mt-4">
                Request an appointment
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
