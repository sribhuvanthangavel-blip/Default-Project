import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/env';

export const alt = `${SITE_NAME} — considered dental care`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Generated at request time with the built-in font stack, so the build never
 * depends on fetching a font file. Palette values are hard-coded because Tailwind
 * CSS variables are not available inside ImageResponse.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0b241b',
        padding: '72px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: -120,
          width: 620,
          height: 620,
          borderRadius: 999,
          background: 'rgba(26, 66, 50, 0.55)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -140,
          bottom: -220,
          width: 560,
          height: 560,
          borderRadius: 999,
          border: '1px solid rgba(195, 161, 92, 0.28)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 22, position: 'relative' }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 999,
            border: '1.5px solid rgba(195, 161, 92, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f7f2e8',
            fontSize: 40,
            fontFamily: 'Georgia, serif',
          }}
        >
          J
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#f7f2e8', fontSize: 40, fontFamily: 'Georgia, serif' }}>
            Jishnu&apos;s
          </span>
          <span
            style={{
              color: 'rgba(247, 242, 232, 0.6)',
              fontSize: 17,
              letterSpacing: 8,
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            Dentistry
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            color: '#d8bd85',
            fontSize: 20,
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          Dental care · By appointment
        </span>
        <span
          style={{
            color: '#fcfaf5',
            fontSize: 78,
            lineHeight: 1.05,
            marginTop: 24,
            maxWidth: 900,
            fontFamily: 'Georgia, serif',
          }}
        >
          A calmer kind of dental care.
        </span>
        <span
          style={{
            color: 'rgba(247, 242, 232, 0.62)',
            fontSize: 26,
            marginTop: 26,
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Request an appointment and the clinic will confirm the details with you personally.
        </span>
      </div>
    </div>,
    size,
  );
}
