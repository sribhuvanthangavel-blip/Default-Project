'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log only the digest and message identifier. Never log form payloads.
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'render.error_boundary',
        digest: error.digest ?? null,
      }),
    );
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-50 px-5 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="eyebrow text-gold-700">Something went wrong</p>
        <h1 className="display-2 mt-4 text-forest-950">That did not work.</h1>
        <p className="lede mt-5 text-muted">
          An unexpected problem stopped this page loading. Your information has not been lost, and
          nothing was submitted.
        </p>
        {error.digest ? (
          <p className="mt-4 text-[0.75rem] tracking-wide text-muted/70">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className="btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn-outline">
            Return home
          </Link>
        </div>
        <p className="mt-8 text-[0.82rem] leading-6 text-muted">
          If this keeps happening, please contact the clinic directly.
        </p>
      </div>
    </main>
  );
}
