'use client';

/**
 * Last-resort boundary: used when the root layout itself fails, so it must
 * render its own <html> and <body> and cannot rely on global CSS being applied
 * in every error path.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fcfaf5',
          color: '#151914',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              color: '#8a6827',
              margin: 0,
            }}
          >
            Jishnu&apos;s Dentistry
          </p>
          <h1 style={{ fontSize: '2rem', marginTop: '1rem', fontWeight: 500 }}>
            The site could not load.
          </h1>
          <p style={{ color: '#5c645b', lineHeight: 1.7, marginTop: '1rem' }}>
            Please try again in a moment. If the problem continues, contact the clinic directly.
          </p>
          {error.digest ? (
            <p style={{ color: '#5c645b', fontSize: '0.75rem', marginTop: '1rem' }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              border: 0,
              borderRadius: '999px',
              padding: '0.9rem 1.75rem',
              background: '#c3a15c',
              color: '#061711',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
