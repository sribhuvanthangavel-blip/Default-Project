import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  aside?: ReactNode;
  tone?: 'cream' | 'forest';
}

export function PageHero({
  eyebrow,
  title,
  body,
  breadcrumbs,
  aside,
  tone = 'cream',
}: PageHeroProps) {
  const dark = tone === 'forest';

  return (
    <section
      className={
        dark
          ? 'grain relative overflow-hidden bg-forest-950 text-cream-50'
          : 'relative overflow-hidden border-b border-line bg-cream-100/70'
      }
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-40 right-[-10rem] size-[30rem] rounded-full blur-3xl ${
          dark ? 'bg-forest-700/40' : 'bg-gold-200/40'
        }`}
      />

      <div className="container-page relative py-14 sm:py-16 lg:py-20">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol
              className={`flex flex-wrap items-center gap-2 text-[0.7rem] tracking-wide ${
                dark ? 'text-cream-100/50' : 'text-muted'
              }`}
            >
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden>/</span> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition hover:text-gold-600">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p
              className={`eyebrow flex items-center gap-3 ${dark ? 'text-gold-300' : 'text-gold-700'}`}
            >
              <span aria-hidden className="h-px w-7 bg-current opacity-60" />
              {eyebrow}
            </p>
            <h1
              className={`display-2 mt-5 max-w-3xl ${dark ? 'text-cream-50' : 'text-forest-950'}`}
            >
              {title}
            </h1>
            {body ? (
              <div className={`lede mt-6 max-w-2xl ${dark ? 'text-cream-100/70' : 'text-muted'}`}>
                {body}
              </div>
            ) : null}
          </div>
          {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
