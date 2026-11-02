import type { Metadata } from 'next';
import Link from 'next/link';
import { HOME_COPY, PRINCIPLES, PROCESS_STEPS, FAQS } from '@/content/site';
import { getPublicSettings } from '@/lib/db/settings';
import { listPublicServices } from '@/lib/db/services';
import { CtaBand, SectionHeading } from '@/components/site/sections';
import { Reveal } from '@/components/ui/reveal';
import { ArrowRightIcon, CheckIcon, SparkleIcon } from '@/components/ui/icons';
import { telHref } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Considered dental care',
  description:
    'Request an appointment at Jishnu\u2019s Dentistry. A calm, considered dental practice with personal confirmation from the clinic.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [services, settings] = await Promise.all([listPublicServices(), getPublicSettings()]);
  const featured = services.slice(0, 4);
  const phone = telHref(settings.clinicPhone);

  return (
    <>
      <section className="grain relative overflow-hidden bg-forest-950 text-cream-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-64 -left-40 size-[42rem] rounded-full bg-forest-700/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-12rem] bottom-[-20rem] size-[38rem] rounded-full border border-gold-400/15"
        />

        <div className="container-page relative grid items-center gap-16 py-16 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:py-28">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold-300">
              <span aria-hidden className="size-1.5 rounded-full bg-gold-400" />
              {HOME_COPY.eyebrow}
            </p>

            <h1 className="display-1 mt-6 text-cream-50">
              {HOME_COPY.titleLead}{' '}
              <em className="font-light text-gold-300 italic">{HOME_COPY.titleEmphasis}</em>
            </h1>

            <p className="lede mt-7 max-w-xl text-cream-100/70">{HOME_COPY.body}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/appointment" className="btn-primary">
                {HOME_COPY.primaryCta}
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link href="/about" className="btn-light-outline">
                {HOME_COPY.secondaryCta}
              </Link>
            </div>

            <ul className="mt-11 flex flex-wrap gap-x-7 gap-y-3">
              {HOME_COPY.trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-[0.74rem] tracking-wide text-cream-100/55"
                >
                  <CheckIcon className="size-3.5 text-gold-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="relative overflow-hidden rounded-t-[14rem] rounded-b-[2rem] border border-gold-400/25 bg-gradient-to-b from-forest-800/80 to-forest-900/40 px-8 pt-24 pb-10 text-center">
              <div
                aria-hidden
                className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
              />
              <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-gold-400/40">
                <SparkleIcon className="size-6 text-gold-300" />
              </span>
              <p className="mt-8 font-display text-[2rem] leading-tight text-cream-50">
                &ldquo;Clear communication, a calm room, and a plan you can understand.&rdquo;
              </p>
              <p className="mt-6 text-[0.68rem] tracking-[0.24em] text-gold-300/80 uppercase">
                The practice approach
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-[0.72rem] text-cream-100/45">
                <span aria-hidden className="h-px w-8 bg-cream-50/20" />
                Jishnu&apos;s Dentistry
                <span aria-hidden className="h-px w-8 bg-cream-50/20" />
              </div>
            </div>

            <div className="mx-4 -mt-6 rounded-2xl border border-cream-50/10 bg-cream-50 p-5 text-ink shadow-soft sm:mx-8">
              <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-700 uppercase">
                How it works
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Send a request. The clinic reviews it and confirms the time with you personally.
              </p>
              {phone ? (
                <a
                  href={phone}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-forest-800"
                >
                  Call {settings.clinicPhone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="The practice"
              title={
                <>
                  Time to be heard.
                  <br />
                  Space to ask.
                </>
              }
              body="Good dentistry begins with a conversation. The clinic is built around unhurried appointments, plain-language explanations and a plan you can make sense of."
            />
          </Reveal>

          <Reveal delay={120}>
            <div className="grid gap-8 sm:grid-cols-2 lg:mt-2">
              {PRINCIPLES.map((principle, index) => (
                <div key={principle.title} className="border-t border-line pt-5">
                  <p className="font-display text-2xl text-gold-600">0{index + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold text-forest-900">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{principle.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-cream-100/70">
        <div className="container-page py-20 lg:py-24">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Services"
              title="Care, considered."
              body="The clinic manages this treatment list directly. If you are unsure where to begin, a consultation is the right first step."
            />
            <Link href="/services" className="btn-outline shrink-0">
              View all services
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((service, index) => (
                <Reveal key={service.id} delay={index * 70}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="group flex h-full flex-col rounded-card border border-line bg-cream-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-gold-400/70 hover:shadow-card"
                  >
                    <span className="text-[0.65rem] font-semibold tracking-[0.22em] text-gold-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-5 font-display text-[1.55rem] leading-snug text-forest-950">
                      {service.name}
                    </h3>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted">
                      {service.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-forest-800 uppercase">
                      Read more
                      <ArrowRightIcon className="size-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-card border border-line bg-cream-50 p-8">
              <p className="font-display text-2xl text-forest-900">
                The treatment list is being prepared.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Please send an enquiry describing what you need help with, or request a
                consultation, and the clinic will guide you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/appointment" className="btn-dark btn-sm">
                  Request a consultation
                </Link>
                <Link href="/contact" className="btn-outline btn-sm">
                  Send an enquiry
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="The first visit"
          title="Three quiet steps."
          body="Nothing about the process is designed to rush you. Here is exactly what happens after you press send."
          align="center"
        />

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {PROCESS_STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 90}>
              <div className="relative h-full border-t border-gold-400/50 pt-6 md:border-t md:border-l md:border-l-line md:pt-8 md:pl-8 md:first:border-l-0 md:first:pl-0">
                <p className="font-display text-4xl font-light text-gold-500/80">{step.number}</p>
                <h3 className="mt-4 font-display text-2xl text-forest-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl rounded-xl bg-forest-50 px-5 py-4 text-center text-[0.82rem] leading-6 text-forest-800">
          An appointment request is not a confirmed booking. The clinic will contact you to confirm
          the date and time.
        </p>
      </section>

      <section className="border-t border-line bg-cream-100/60">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-24">
          <div>
            <SectionHeading
              eyebrow="Questions"
              title="Before you book."
              body="A few things people usually want to know. If your question is not here, the clinic would rather you ask than guess."
            />
            <Link href="/contact" className="btn-outline mt-8">
              Ask the clinic
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <span className="font-medium text-forest-950">{faq.question}</span>
                  <span
                    aria-hidden
                    className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-gold-600 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-xl pr-8 text-sm leading-7 text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
