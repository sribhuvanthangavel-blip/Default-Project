import type { Metadata } from 'next';
import Link from 'next/link';
import { SERVICES_COPY } from '@/content/site';
import { listPublicServices } from '@/lib/db/services';
import { PageHero } from '@/components/site/page-hero';
import { CtaBand } from '@/components/site/sections';
import { Reveal } from '@/components/ui/reveal';
import { ArrowRightIcon, CalendarIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'The treatment list at Jishnu\u2019s Dentistry, managed directly by the clinic. Request a consultation if you are unsure where to begin.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await listPublicServices();

  return (
    <>
      <PageHero
        eyebrow={SERVICES_COPY.eyebrow}
        title={SERVICES_COPY.title}
        body={SERVICES_COPY.body}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
        aside={
          <div className="max-w-xs rounded-card border border-gold-400/30 bg-cream-50 p-6">
            <CalendarIcon className="size-6 text-gold-600" />
            <p className="mt-4 font-display text-xl text-forest-950">Not sure where to start?</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Choose a consultation and describe your concern. The clinic will guide you from there.
            </p>
            <Link href="/appointment" className="btn-dark btn-sm mt-5 w-full">
              Request a consultation
            </Link>
          </div>
        }
      />

      <section className="container-page py-16 lg:py-24">
        {services.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <Reveal key={service.id} delay={index * 60}>
                  <article className="group flex h-full flex-col rounded-card border border-line bg-cream-50 p-7 transition duration-300 hover:border-gold-400/70 hover:shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.65rem] font-semibold tracking-[0.22em] text-gold-600">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-line" />
                    </div>
                    <h2 className="mt-6 font-display text-[1.7rem] leading-snug text-forest-950">
                      <Link
                        href={`/services/${service.slug}`}
                        className="after:absolute after:inset-0"
                      >
                        {service.name}
                      </Link>
                    </h2>
                    <p className="mt-3 line-clamp-4 flex-1 text-sm leading-7 text-muted">
                      {service.description || 'Ask the clinic for details about this service.'}
                    </p>
                    <span className="mt-7 inline-flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-forest-800 uppercase">
                      Service details
                      <ArrowRightIcon className="size-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </article>
                </Reveal>
              ))}
            </div>

            {services.length < 4 ? (
              <p className="mt-10 rounded-xl border border-line bg-cream-100/70 px-5 py-4 text-sm leading-6 text-muted">
                The clinic maintains this list and may not have published every treatment yet. If
                you cannot see what you are looking for, send an enquiry and describe what you need
                help with.
              </p>
            ) : null}
          </>
        ) : (
          <div className="mx-auto max-w-2xl rounded-card border border-line bg-cream-50 p-8 text-center sm:p-12">
            <CalendarIcon className="mx-auto size-8 text-gold-600" />
            <h2 className="mt-6 font-display text-3xl text-forest-950">
              The treatment list is being prepared.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              The clinic has not published its services yet. You can still request a consultation or
              send an enquiry describing what you need help with.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/appointment" className="btn-primary">
                Request a consultation
              </Link>
              <Link href="/contact" className="btn-outline">
                Send an enquiry
              </Link>
            </div>
          </div>
        )}
      </section>

      <CtaBand
        title="Care starts with a conversation."
        body="If you are unsure which service fits, say so in the request. The clinic would rather help you choose than have you guess."
      />
    </>
  );
}
