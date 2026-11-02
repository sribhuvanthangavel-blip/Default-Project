import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ArrowRightIcon } from '@/components/ui/icons';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream-50 px-5 py-16 text-center">
      <Logo />
      <p className="eyebrow mt-12 text-gold-700">404</p>
      <h1 className="display-2 mt-4 max-w-xl text-forest-950">This page is not here.</h1>
      <p className="lede mt-5 max-w-md text-muted">
        The page may have moved, or the link may be slightly wrong. The clinic is still easy to
        reach.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Return home
          <ArrowRightIcon className="size-4" />
        </Link>
        <Link href="/appointment" className="btn-outline">
          Request an appointment
        </Link>
      </div>
      <nav aria-label="Helpful links" className="mt-12">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <li>
            <Link href="/about" className="link-underline text-forest-800">
              The clinic
            </Link>
          </li>
          <li>
            <Link href="/services" className="link-underline text-forest-800">
              Services
            </Link>
          </li>
          <li>
            <Link href="/contact" className="link-underline text-forest-800">
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
