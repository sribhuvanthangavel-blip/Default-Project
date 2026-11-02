import type { Metadata } from 'next';
import Link from 'next/link';
import { ABOUT_COPY, PRINCIPLES, PROCESS_STEPS } from '@/content/site';
import { getPublicSettings } from '@/lib/db/settings';
import { PageHero } from '@/components/site/page-hero';
import { CtaBand, SectionHeading } from '@/components/site/sections';
import { Reveal } from '@/components/ui/reveal';
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/ui/icons';
import { mailtoHref, telHref } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'The clinic',
  description:
    'A calm, considered approach to dental care: clear explanations, unhurried appointments and a plan you can understand.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const settings = await getPublicSettings();
  const phone = telHref(settings.clinicPhone);
  const email = mailtoHref(settings.clinicEmail);
  const hasDetails = Boolean(
    settings.clinicAddress || settings.clinicHours || phone || email || settings.clinicMapUrl,
  );

  return (
    <>
      <PageHero
        eyebrow={ABOUT_COPY.eyebrow}
        title={ABOUT_COPY.title}
        body={ABOUT_COPY.paragraphs[0]}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'The clinic' }]}
      />

      <section className="container-page py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-32">
              <p className="eyebrow text-gold-700">Our approach</p>
              <blockquote className="mt-6 font-display text-[2.3rem] leading-[1.15] font-light text-forest-950 sm:text-[2.75rem]">
                &ldquo;{ABOUT_COPY.quote}&rdquo;
              </blockquote>
              <p className="mt-8 max-w-sm text-sm leading-7 text-muted">
                That principle shapes the website too: nothing is confirmed until the clinic
                confirms it, and nothing is published until it has been verified.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-6">
              {ABOUT_COPY.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[1.02rem] leading-8 text-muted">
                  {paragraph}
                </p>
              ))}

              <div className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
                {PRINCIPLES.map((principle, index) => (
                  <div key={principle.title}>
                    <p className="font-display text-2xl text-gold-500">0{index + 1}</p>
                    <h2 className="mt-2 text-sm font-semibold text-forest-900">
                      {principle.title}
                    </h2>
                    <p className="mt-2 text-[0.82rem] leading-6 text-muted">{principle.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-cream-100/60">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-24">
          <SectionHeading
            eyebrow="Clinic details"
            title="The practical information."
            body="This website only publishes details the clinic has supplied. Anything still being confirmed is labelled clearly rather than guessed."
          />

          <div className="rounded-card border border-line bg-cream-50 p-7 sm:p-9">
            {hasDetails ? (
              <dl className="space-y-6">
                {settings.clinicAddress ? (
                  <div className="flex gap-4">
                    <MapPinIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                    <div>
                      <dt className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted uppercase">
                        Address
                      </dt>
                      <dd className="mt-1 text-sm leading-6 whitespace-pre-line text-forest-900">
                        {settings.clinicAddress}
                      </dd>
                    </div>
                  </div>
                ) : null}

                {settings.clinicHours ? (
                  <div className="flex gap-4">
                    <ClockIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                    <div>
                      <dt className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted uppercase">
                        Opening hours
                      </dt>
                      <dd className="mt-1 text-sm leading-6 whitespace-pre-line text-forest-900">
                        {settings.clinicHours}
                      </dd>
                    </div>
                  </div>
                ) : null}

                {phone ? (
                  <div className="flex gap-4">
                    <PhoneIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                    <div>
                      <dt className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted uppercase">
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

                {email ? (
                  <div className="flex gap-4">
                    <MailIcon className="mt-0.5 size-5 shrink-0 text-gold-600" />
                    <div>
                      <dt className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted uppercase">
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
              </dl>
            ) : (
              <div>
                <p className="font-display text-2xl text-forest-900">
                  Address and hours are being confirmed.
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  The clinic has not yet published its address, opening hours or direct phone number
                  here. You can still send an enquiry, and the clinic will respond with the details
                  you need.
                </p>
                <Link href="/contact" className="btn-dark btn-sm mt-6">
                  Send an enquiry
                </Link>
              </div>
            )}

            {settings.clinicMapUrl && hasDetails ? (
              <a
                href={settings.clinicMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex text-sm font-semibold text-forest-800 underline decoration-gold-400 underline-offset-4"
              >
                Open the location in maps
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-page py-20 lg:py-24">
        <SectionHeading
          eyebrow="Your visit"
          title="What to expect."
          body="The same three steps apply whether you are booking a routine conversation or asking about something specific."
          align="center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROCESS_STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 70}>
              <div className="h-full rounded-card border border-line bg-cream-50 p-7">
                <p className="font-display text-3xl text-gold-500/80">{step.number}</p>
                <h3 className="mt-4 font-display text-2xl text-forest-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand
        title="Come and have a conversation."
        body="Send a request and the clinic will confirm the time with you. If you would rather ask a question first, that is just as welcome."
      />
    </>
  );
}
