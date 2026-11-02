import Link from 'next/link';
import { PageHero } from '@/components/site/page-hero';
import { ArrowRightIcon } from '@/components/ui/icons';

export default function SiteNotFound() {
  return (
    <>
      <PageHero
        eyebrow="Not found"
        title="We could not find that page."
        body="The link may be old, or the page may have been renamed. Nothing else has changed — the clinic is still here."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Not found' }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-xl rounded-card border border-line bg-cream-50 p-8">
          <h2 className="font-display text-2xl text-forest-950">Try one of these instead</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link href="/" className="link-underline text-forest-800">
                Home
              </Link>
            </li>
            <li>
              <Link href="/services" className="link-underline text-forest-800">
                Services
              </Link>
            </li>
            <li>
              <Link href="/contact" className="link-underline text-forest-800">
                Contact the clinic
              </Link>
            </li>
          </ul>
          <Link href="/appointment" className="btn-primary mt-8 w-full">
            Request an appointment
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
