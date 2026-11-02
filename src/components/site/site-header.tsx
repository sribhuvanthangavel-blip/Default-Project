'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV_LINKS } from '@/content/navigation';
import { Logo } from '@/components/ui/logo';
import { ArrowRightIcon, CloseIcon, MenuIcon, PhoneIcon } from '@/components/ui/icons';

interface SiteHeaderProps {
  announcement: string;
  phone: string;
  phoneHref: string | null;
  bookingEnabled: boolean;
}

export function SiteHeader({ announcement, phone, phoneHref, bookingEnabled }: SiteHeaderProps) {
  const pathname = usePathname();
  // Keyed by pathname so navigating closes the panel without a state-syncing effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = useCallback((next: boolean) => setOpenFor(next ? pathname : null), [pathname]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const bookingHref = bookingEnabled ? '/appointment' : '/contact';
  const bookingLabel = bookingEnabled ? 'Book an appointment' : 'Contact the clinic';

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const firstLink = panelRef.current?.querySelector<HTMLElement>('a, button');
    firstLink?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, setOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50">
      {announcement ? (
        <div className="bg-forest-950 px-4 py-2.5 text-center text-[0.7rem] font-medium tracking-[0.12em] text-gold-200 uppercase">
          {announcement}
        </div>
      ) : null}

      <div className="border-b border-line/80 bg-cream-50/92 backdrop-blur-md">
        <div className="container-page flex h-[4.6rem] items-center justify-between gap-5">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {phone && phoneHref ? (
              <a
                href={phoneHref}
                className="hidden items-center gap-2 text-[0.8rem] font-medium tracking-wide text-forest-900 transition hover:text-forest-700 xl:flex"
              >
                <PhoneIcon className="size-4 text-gold-600" />
                {phone}
              </a>
            ) : null}

            <Link href={bookingHref} className="btn-primary btn-sm hidden sm:inline-flex">
              {bookingLabel}
              <ArrowRightIcon className="size-3.5" />
            </Link>

            <button
              ref={buttonRef}
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full border border-forest-900/15 text-forest-900 transition hover:bg-forest-900/5 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen(!open)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {open ? (
          <div
            id="mobile-navigation"
            ref={panelRef}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.6rem)] overflow-y-auto border-b border-line bg-cream-50 px-5 pt-2 pb-7 shadow-soft lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-line/70 py-4 font-display text-2xl text-forest-900"
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 flex flex-col gap-3">
              <Link href={bookingHref} className="btn-primary w-full">
                {bookingLabel}
                <ArrowRightIcon className="size-4" />
              </Link>
              {phone && phoneHref ? (
                <a href={phoneHref} className="btn-outline w-full">
                  <PhoneIcon className="size-4" />
                  {phone}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
