import type { Metadata } from 'next';
import Link from 'next/link';
import { DENTIST_COPY } from '@/content/site';
import { PageHero } from '@/components/site/page-hero';
import { CtaBand } from '@/components/site/sections';
import { CheckIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Your dentist',
  description:
    'The dentist profile for Jishnu\u2019s Dentistry is published only once the clinic has supplied verified qualifications and registration details.',
  alternates: { canonical: '/dentist' },
};

export default function DentistPage() {
  return (
    <>
      <PageHero
        eyebrow={DENTIST_COPY.eyebrow}
        title={DENTIST_COPY.title}
        body={DENTIST_COPY.body}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Your dentist' }]}
      />

      <section className="container-page py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="relative">
            <div className="grain relative aspect-[4/5] overflow-hidden rounded-t-[12rem] rounded-b-[2rem] border border-gold-400/30 bg-gradient-to-b from-forest-800 to-forest-950">
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <span className="flex size-24 items-center justify-center rounded-full border border-gold-400/40 font-display text-5xl font-light text-gold-300">
                  J
                </span>
                <p className="mt-8 text-[0.65rem] font-semibold tracking-[0.26em] text-gold-300/80 uppercase">
                  Profile pending
                </p>
                <p className="mt-3 max-w-[15rem] text-sm leading-6 text-cream-100/55">
                  Verified name, qualifications and registration details will appear here.
                </p>
              </div>
            </div>
            <p className="mt-4 text-center text-[0.7rem] tracking-wide text-muted">
              No unverified credentials are published on this website.
            </p>
          </div>

          <div className="lg:pt-4">
            <p className="eyebrow text-gold-700">Before launch</p>
            <h2 className="display-3 mt-4 text-forest-950">
              Why this page is intentionally incomplete.
            </h2>
            <div className="mt-6 space-y-4 text-[0.98rem] leading-8 text-muted">
              <p>
                A dentist&apos;s name, qualifications and registration number are factual claims
                that patients rely on. Publishing them without verification would be misleading,
                even if the design looked more finished.
              </p>
              <p>
                The clinic will supply the verified profile before launch. In the meantime, you can
                request an appointment and ask the clinic directly who will see you and what to
                expect.
              </p>
            </div>

            <div className="mt-10 rounded-card border border-line bg-cream-100/70 p-7">
              <h3 className="text-sm font-semibold tracking-wide text-forest-900 uppercase">
                Worth asking
              </h3>
              <ul className="mt-5 space-y-3">
                {DENTIST_COPY.questions.map((question) => (
                  <li key={question} className="flex gap-3 text-sm leading-6 text-muted">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-gold-600" />
                    {question}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/appointment" className="btn-primary">
                Request an appointment
              </Link>
              <Link href="/contact" className="btn-outline">
                Ask the clinic
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title="Ask before you book."
        body="If knowing who you will see matters to you — and it is a reasonable thing to want — ask the clinic directly. A good practice will answer."
        primaryLabel="Send a question"
        primaryHref="/contact"
        secondaryLabel="Request an appointment"
        secondaryHref="/appointment"
      />
    </>
  );
}
