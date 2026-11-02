import { describe, expect, it } from 'vitest';
import { RateLimiter } from '@/lib/security/rate-limit';
import { sanitizeSearchTerm, toPostgrestPattern } from '@/lib/security/search';
import { parsePage, parsePageSize, parseDateParam } from '@/lib/pagination';
import { parsePublicSettings, telHref, whatsappHref, mailtoHref } from '@/lib/settings';
import { safeJsonLd } from '@/lib/seo';
import { AppError, toAppError } from '@/lib/errors';

describe('RateLimiter', () => {
  const options = { limit: 3, windowMs: 60_000 };

  it('allows requests up to the limit, then blocks', () => {
    const limiter = new RateLimiter(options);
    expect(limiter.check('ip-a', 0).ok).toBe(true);
    expect(limiter.check('ip-a', 1).ok).toBe(true);
    expect(limiter.check('ip-a', 2).ok).toBe(true);

    const blocked = limiter.check('ip-a', 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps separate counters per key', () => {
    const limiter = new RateLimiter(options);
    limiter.check('ip-a', 0);
    limiter.check('ip-a', 0);
    limiter.check('ip-a', 0);
    expect(limiter.check('ip-a', 0).ok).toBe(false);
    expect(limiter.check('ip-b', 0).ok).toBe(true);
  });

  it('resets after the window elapses', () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 1_000 });
    expect(limiter.check('ip', 0).ok).toBe(true);
    expect(limiter.check('ip', 500).ok).toBe(false);
    expect(limiter.check('ip', 1_001).ok).toBe(true);
  });

  it('does not grow without bound', () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 10_000, maxKeys: 10 });
    for (let index = 0; index < 100; index += 1) {
      limiter.check(`key-${index}`, 0);
    }
    expect(limiter.size()).toBeLessThanOrEqual(10);
  });
});

describe('search sanitisation', () => {
  it('removes PostgREST filter syntax', () => {
    const cleaned = sanitizeSearchTerm('smith,email.eq.x) or(1=1');
    expect(cleaned).not.toMatch(/[(),]/);
    expect(cleaned).toContain('smith');
  });

  it('keeps letters, spaces and ordinary punctuation', () => {
    expect(sanitizeSearchTerm("O'Brien")).toBe("O'Brien");
    expect(sanitizeSearchTerm('  asha@example.com  ')).toBe('asha@example.com');
  });

  it('caps length and handles empty input', () => {
    expect(sanitizeSearchTerm('a'.repeat(200))).toHaveLength(80);
    expect(sanitizeSearchTerm(undefined)).toBe('');
    expect(toPostgrestPattern('abc')).toBe('%abc%');
  });
});

describe('pagination helpers', () => {
  it('clamps page numbers', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-2')).toBe(1);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it('only allows the configured page sizes', () => {
    expect(parsePageSize('20', [10, 20, 50])).toBe(20);
    expect(parsePageSize('500', [10, 20, 50])).toBe(10);
    expect(parsePageSize(undefined)).toBe(10);
  });

  it('rejects malformed dates', () => {
    expect(parseDateParam('2026-11-02')).toBe('2026-11-02');
    expect(parseDateParam('02/11/2026')).toBeUndefined();
    expect(parseDateParam(undefined)).toBeUndefined();
  });
});

describe('settings parsing and link building', () => {
  it('falls back to safe defaults when nothing is configured', () => {
    const settings = parsePublicSettings([]);
    expect(settings.clinicPhone).toBe('');
    expect(settings.bookingEnabled).toBe(true);
    expect(settings.announcement).toBe('');
  });

  it('reads stored values, coercing strings and json booleans', () => {
    const settings = parsePublicSettings([
      { setting_key: 'clinic_phone', setting_value: '+91 98765 43210' },
      { setting_key: 'announcement', setting_value: '  Closed on Friday  ' },
      { setting_key: 'booking_enabled', setting_value: 'false' },
    ]);
    expect(settings.clinicPhone).toBe('+91 98765 43210');
    expect(settings.announcement).toBe('Closed on Friday');
    expect(settings.bookingEnabled).toBe(false);
  });

  it('builds only usable links', () => {
    expect(telHref('')).toBeNull();
    expect(telHref('+91 98765 43210')).toBe('tel:+919876543210');
    expect(whatsappHref('+91 98765 43210')).toBe('https://wa.me/919876543210');
    expect(whatsappHref('123')).toBeNull();
    expect(mailtoHref('reception@example.com')).toBe('mailto:reception@example.com');
    expect(mailtoHref('not-an-email')).toBeNull();
  });
});

describe('safeJsonLd', () => {
  it('escapes angle brackets so a value cannot close the script tag', () => {
    const serialised = safeJsonLd({ name: '</script><img onerror=alert(1)>' });
    expect(serialised).not.toContain('</script>');
    expect(serialised).toContain('\\u003c');
  });
});

describe('error mapping', () => {
  it('passes AppError messages through', () => {
    const mapped = toAppError(new AppError('validation', 'Check the form.'));
    expect(mapped.code).toBe('validation');
    expect(mapped.publicMessage).toBe('Check the form.');
  });

  it('never exposes an unexpected error message to the browser', () => {
    const mapped = toAppError(new Error('relation "appointments" does not exist'));
    expect(mapped.code).toBe('unknown');
    expect(mapped.publicMessage).toBe('Something went wrong. Please try again.');
    expect(mapped.publicMessage).not.toContain('appointments');
  });
});
