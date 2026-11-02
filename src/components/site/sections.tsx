import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from '@/components/ui/icons';

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'left',
  tone = 'dark',
  className = '',
}: SectionHeadingProps) {
  return (
    <div
      className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}
    >
      <p
        className={`eyebrow ${tone === 'light' ? 'text-gold-300' : 'text-gold-700'} flex items-center gap-3 ${
          align === 'center' ? 'justify-center' : ''
        }`}
      >
        <span aria-hidden className="h-px w-7 bg-current opacity-60" />
        {eyebrow}
      </p>
      <h2 className={`display-2 mt-4 ${tone === 'light' ? 'text-cream-50' : 'text-forest-950'}`}>
        {title}
      </h2>
      {body ? (
        <div className={`lede mt-5 ${tone === 'light' ? 'text-cream-100/70' : 'text-muted'}`}>
          {body}
        </div>
      ) : null}
    </div>
  );
}

interface CtaBandProps {
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function CtaBand({
  title = 'Ready when you are.',
  body = 'Send a request and the clinic will confirm the details with you personally. No account, no payment and no obligation.',
  primaryHref = '/appointment',
  primaryLabel = 'Request an appointment',
  secondaryHref = '/contact',
  secondaryLabel = 'Ask a question',
}: CtaBandProps) {
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="grain relative overflow-hidden rounded-[2rem] bg-forest-900 px-6 py-14 text-center sm:px-12 lg:px-20 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full border border-gold-400/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 left-1/2 size-[34rem] -translate-x-1/2 rounded-full border border-gold-400/10"
        />
        <div className="relative mx-auto max-w-2xl">
          <p className="eyebrow text-gold-300">Appointments</p>
          <h2 className="display-2 mt-4 text-cream-50">{title}</h2>
          <p className="lede mt-5 text-cream-100/70">{body}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={primaryHref} className="btn-primary w-full sm:w-auto">
              {primaryLabel}
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link href={secondaryHref} className="btn-light-outline w-full sm:w-auto">
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
