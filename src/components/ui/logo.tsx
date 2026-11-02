import Link from 'next/link';

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  href?: string;
}

export function Logo({ variant = 'dark', className = '', href = '/' }: LogoProps) {
  const text = variant === 'light' ? 'text-cream-50' : 'text-forest-950';
  const sub = variant === 'light' ? 'text-cream-100/70' : 'text-forest-900/55';
  const ring = variant === 'light' ? 'border-gold-300/70' : 'border-gold-500/70';

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="Jishnu's Dentistry — home"
    >
      <span
        className={`relative flex size-11 shrink-0 items-center justify-center rounded-full border ${ring} transition group-hover:border-gold-500`}
      >
        <span className={`font-display text-[1.35rem] leading-none ${text}`}>J</span>
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-cream-50 bg-gold-400" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.35rem] tracking-[0.01em] ${text}`}>
          Jishnu&apos;s
        </span>
        <span className={`mt-1 text-[0.55rem] font-semibold tracking-[0.32em] uppercase ${sub}`}>
          Dentistry
        </span>
      </span>
    </Link>
  );
}
