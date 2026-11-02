import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalReviewNotice } from '@/components/site/legal-notice';
import { PageHero } from '@/components/site/page-hero';
import { TERMS_SECTIONS } from '@/content/legal';

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description:
    'The terms that apply to using the Jishnu\u2019s Dentistry website, including how appointment requests work.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & conditions"
        body="The rules for using this website, and what an appointment request does and does not mean."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms & conditions' }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <LegalReviewNotice />

          <p className="text-sm text-muted">
            Effective date: <time dateTime="2026-11-02">2 November 2026</time>
          </p>

          <div className="prose-clinic mt-8">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-card border border-line bg-cream-100/70 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-forest-900 uppercase">
              Related pages
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li>
                <Link href="/privacy" className="link-underline text-forest-800">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/appointment" className="link-underline text-forest-800">
                  Request an appointment
                </Link>
              </li>
              <li>
                <Link href="/contact" className="link-underline text-forest-800">
                  Contact the clinic
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
