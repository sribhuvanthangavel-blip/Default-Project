import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';

/**
 * The logger is the last place patient data could leak into Vercel logs, so the
 * redaction is tested rather than assumed.
 */
describe('logger redaction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function capture(): string[] {
    const lines: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((value) => {
      lines.push(String(value));
    });
    vi.spyOn(console, 'error').mockImplementation((value) => {
      lines.push(String(value));
    });
    return lines;
  }

  it('keeps the event name and non-sensitive fields', () => {
    const lines = capture();
    logger.warn({ event: 'public_form.rate_limited', scope: 'appointment' });

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0] as string);
    expect(entry.level).toBe('warn');
    expect(entry.event).toBe('public_form.rate_limited');
    expect(entry.scope).toBe('appointment');
  });

  it('redacts patient identifiers even if a call site passes them', () => {
    const lines = capture();
    logger.error({
      event: 'test.leak',
      email: 'asha@example.com',
      phone: '+919876543210',
      patientName: 'Asha Menon',
      message: 'Please call me about my tooth',
      password: 'placeholder-value-1234',
    });

    const serialised = lines[0] as string;
    expect(serialised).not.toContain('asha@example.com');
    expect(serialised).not.toContain('9876543210');
    expect(serialised).not.toContain('Asha Menon');
    expect(serialised).not.toContain('my tooth');
    expect(serialised).not.toContain('placeholder-value');

    const entry = JSON.parse(serialised);
    expect(entry.email).toBe('[redacted]');
    expect(entry.phone).toBe('[redacted]');
  });

  it('does not redact structured operational fields', () => {
    const lines = capture();
    logger.warn({
      event: 'action.failed',
      action: 'appointment.status_changed',
      resourceType: 'appointment',
      status: 500,
    });

    const entry = JSON.parse(lines[0] as string);
    expect(entry.action).toBe('appointment.status_changed');
    expect(entry.resourceType).toBe('appointment');
    expect(entry.status).toBe(500);
  });
});
