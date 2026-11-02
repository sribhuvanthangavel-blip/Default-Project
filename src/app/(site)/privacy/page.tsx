import type { Metadata } from 'next';
import { LegalReviewNotice } from '@/components/site/legal-notice';
import { PageHero } from '@/components/site/page-hero';
import { PRIVACY_SECTIONS } from '@/content/legal';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How Jishnu\u2019s Dentistry collects, uses and protects the information you submit through this website.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        body="A plain description of what this website collects, why, who can see it and what you can ask us to do with it."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy policy' }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <LegalReviewNotice />

          <p className="text-sm text-muted">
            Effective date: <time dateTime="2026-11-02">2 November 2026</time>
          </p>

          <div className="prose-clinic mt-8">
            {PRIVACY_SECTIONS.map((section) => (
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
        </div>
      </section>
    </>
  );
}
