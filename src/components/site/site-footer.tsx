import Link from 'next/link';
import { FOOTER_LEGAL_LINKS, NAV_LINKS } from '@/content/navigation';
import { Logo } from '@/components/ui/logo';
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/ui/icons';
import { mailtoHref, telHref, whatsappHref, type PublicSettings } from '@/lib/settings';

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const phone = telHref(settings.clinicPhone);
  const email = mailtoHref(settings.clinicEmail);
  const whatsapp = whatsappHref(settings.clinicWhatsapp);
  const hasDetails = Boolean(phone || email || settings.clinicAddress || settings.clinicHours);

  return (
    <footer className="grain relative overflow-hidden bg-forest-950 text-cream-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-24 size-[28rem] rounded-full bg-forest-700/30 blur-3xl"
      />

      <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1fr] lg:gap-10 lg:py-20">
        <div className="max-w-sm">
          <Logo variant="light" />
          <p className="mt-6 text-sm leading-7 text-cream-100/65">
            A considered dental practice. Appointments are arranged personally with the clinic, so
            the time you are given is the time that has been confirmed for you.
          </p>
          <Link href="/appointment" className="btn-light-outline mt-7">
            Request an appointment
          </Link>
        </div>

        <div>
          <h2 className="text-[0.65rem] font-semibold tracking-[0.22em] text-gold-300 uppercase">
            Explore
          </h2>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-cream-100/70 transition hover:text-cream-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/appointment"
                className="text-sm text-cream-100/70 transition hover:text-cream-50"
              >
                Appointments
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[0.65rem] font-semibold tracking-[0.22em] text-gold-300 uppercase">
            Visit
          </h2>
          <ul className="mt-5 space-y-4 text-sm text-cream-100/70">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold-400" />
              <span>
                {settings.clinicAddress || (
                  <span className="text-cream-100/45">
                    Clinic address to be confirmed.
                    <span className="sr-only"> This information has not yet been supplied.</span>
                  </span>
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-gold-400" />
              <span>
                {settings.clinicHours || (
                  <span className="text-cream-100/45">Opening hours to be confirmed.</span>
                )}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[0.65rem] font-semibold tracking-[0.22em] text-gold-300 uppercase">
            Contact
          </h2>
          <ul className="mt-5 space-y-4 text-sm text-cream-100/70">
            {phone ? (
              <li>
                <a href={phone} className="flex gap-3 transition hover:text-cream-50">
                  <PhoneIcon className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  {settings.clinicPhone}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={email} className="flex gap-3 break-all transition hover:text-cream-50">
                  <MailIcon className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  {settings.clinicEmail}
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 transition hover:text-cream-50"
                >
                  <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  WhatsApp the clinic
                </a>
              </li>
            ) : null}
            {!hasDetails ? (
              <li className="text-cream-100/45">
                Direct contact details are being confirmed. Please use the enquiry form and the
                clinic will respond.
              </li>
            ) : null}
            <li>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border-b border-gold-400/40 pb-0.5 text-gold-200 transition hover:border-gold-300"
              >
                Send an enquiry
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-cream-50/10">
        <div className="container-page flex flex-col gap-4 py-6 text-[0.72rem] text-cream-100/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Jishnu&apos;s Dentistry. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-cream-100">
                {link.label}
              </Link>
            ))}
            <Link href="/admin/login" className="transition hover:text-cream-100">
              Staff sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
