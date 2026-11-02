import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getPublicServiceBySlug, listPublicServices } from '@/lib/db/services';
import { PageHero } from '@/components/site/page-hero';
import { CtaBand } from '@/components/site/sections';
import { ArrowRightIcon, CheckIcon, ShieldIcon } from '@/components/ui/icons';
import { buildBreadcrumbJsonLd, buildServiceJsonLd, safeJsonLd } from '@/lib/seo';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);

  if (!service) {
    return { title: 'Service not found', robots: { index: false, follow: false } };
  }

  return {
    title: service.name,
    description:
      service.description ||
      `${service.name} at Jishnu's Dentistry. Request an appointment and the clinic will confirm the details with you.`,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.name} · Jishnu's Dentistry`,
      description: service.description,
      url: `/services/${service.slug}`,
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);

  if (!service) notFound();

  const [allServices, nonce] = await Promise.all([
    listPublicServices(),
    headers().then((headerList) => headerList.get('x-nonce') ?? undefined),
  ]);

  const related = allServices.filter((item) => item.id !== service.id).slice(0, 3);

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
      { name: service.name, path: `/services/${service.slug}` },
    ]),
    buildServiceJsonLd(service),
  ];

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.name}
        body={service.description || 'The clinic will explain this service and what it involves.'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: service.name },
        ]}
        aside={
          <div className="max-w-xs rounded-card border border-gold-400/30 bg-cream-50 p-6">
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-700 uppercase">
              Request this service
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Send a request with your preferred date and time. The clinic will confirm it with you
              directly.
            </p>
            <Link
              href={`/appointment?service=${service.slug}`}
              className="btn-dark btn-sm mt-5 w-full"
            >
              Request an appointment
            </Link>
          </div>
        }
      />

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <h2 className="display-3 text-forest-950">What to expect.</h2>
            <div className="mt-6 space-y-4 text-[0.98rem] leading-8 text-muted">
              <p>
                The clinic will begin by discussing your concerns and what you would like to change.
                Where an examination is appropriate, it will be explained before it happens. You
                should have the opportunity to ask questions at every stage.
              </p>
              <p>
                Options will be discussed in plain language, including what each involves and what
                happens if you choose to wait. You are never obliged to decide during the
                appointment.
              </p>
            </div>

            <div className="mt-9 rounded-card border border-line bg-cream-100/70 p-6">
              <div className="flex gap-3">
                <ShieldIcon className="mt-0.5 size-5 shrink-0 text-gold-700" />
                <div>
                  <h3 className="text-sm font-semibold text-forest-900">
                    General information, not clinical advice.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    This page describes the service generally. It cannot tell you what is right for
                    your situation. Suitability, risks and alternatives are discussed with the
                    clinic in person.
                  </p>
                </div>
              </div>
            </div>

            <ul className="mt-8 space-y-3">
              {[
                'Ask what the appointment will involve',
                'Ask about alternatives and costs',
                'Take your time before deciding',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-gold-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:pt-2">
            <div className="rounded-card border border-line bg-cream-50 p-7">
              <p className="eyebrow text-gold-700">Appointments</p>
              <h2 className="mt-4 font-display text-2xl text-forest-950">
                A request, then a confirmation.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Online requests are reviewed by the clinic. Your appointment is confirmed only when
                the clinic contacts you to confirm it.
              </p>
              <Link
                href={`/appointment?service=${service.slug}`}
                className="btn-primary mt-6 w-full"
              >
                Request this service
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link href="/contact" className="btn-outline mt-3 w-full">
                Ask a question
              </Link>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <div className="mt-20 border-t border-line pt-12">
            <div className="flex items-end justify-between gap-6">
              <h2 className="display-3 text-forest-950">Other services</h2>
              <Link href="/services" className="link-underline text-sm font-medium text-forest-800">
                View all
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="group rounded-card border border-line bg-cream-50 p-6 transition hover:border-gold-400/70 hover:shadow-card"
                >
                  <h3 className="font-display text-xl text-forest-950">{item.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.14em] text-forest-800 uppercase">
                    Read more
                    <ArrowRightIcon className="size-3.5 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <CtaBand />

      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: safeJsonLd(item) }}
        />
      ))}
    </>
  );
}
