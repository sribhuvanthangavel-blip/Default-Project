import { describe, expect, it } from 'vitest';
import {
  appointmentReference,
  formatClinicDate,
  formatClinicTime,
  isValidISODate,
  isValidTime,
  isPastDate,
  normalizeTime,
  todayInTimeZone,
} from '@/lib/dates';

describe('todayInTimeZone', () => {
  it('resolves the clinic day, not the UTC day', () => {
    // 20:00 UTC is 01:30 the next day in Asia/Kolkata (UTC+5:30).
    const now = new Date('2026-11-02T20:00:00Z');
    expect(todayInTimeZone('Asia/Kolkata', now)).toBe('2026-11-03');
    expect(todayInTimeZone('UTC', now)).toBe('2026-11-02');
  });

  it('handles a time zone behind UTC', () => {
    const now = new Date('2026-11-02T02:00:00Z');
    expect(todayInTimeZone('America/New_York', now)).toBe('2026-11-01');
  });
});

describe('isValidISODate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidISODate('2026-11-02')).toBe(true);
    expect(isValidISODate('2024-02-29')).toBe(true);
  });

  it('rejects impossible or malformed dates', () => {
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2025-02-29')).toBe(false);
    expect(isValidISODate('2026-2-3')).toBe(false);
    expect(isValidISODate('02-11-2026')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });
});

describe('isPastDate', () => {
  const now = new Date('2026-11-02T06:00:00Z'); // 11:30 IST

  it('rejects yesterday and accepts today and tomorrow', () => {
    expect(isPastDate('2026-11-01', 'Asia/Kolkata', now)).toBe(true);
    expect(isPastDate('2026-11-02', 'Asia/Kolkata', now)).toBe(false);
    expect(isPastDate('2026-11-03', 'Asia/Kolkata', now)).toBe(false);
  });

  it('treats an invalid date as past', () => {
    expect(isPastDate('not-a-date', 'Asia/Kolkata', now)).toBe(true);
  });
});

describe('time helpers', () => {
  it('validates 24-hour times', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
  });

  it('normalises seconds away', () => {
    expect(normalizeTime('09:30:00')).toBe('09:30');
    expect(normalizeTime('bad')).toBe('bad');
  });

  it('formats times for people', () => {
    expect(formatClinicTime('09:05')).toBe('9:05 am');
    expect(formatClinicTime('00:00')).toBe('12:00 am');
    expect(formatClinicTime('12:30')).toBe('12:30 pm');
    expect(formatClinicTime('23:59:00')).toBe('11:59 pm');
  });
});

describe('formatClinicDate', () => {
  it('formats without a UTC off-by-one', () => {
    expect(formatClinicDate('2026-11-02')).toBe('2 November 2026');
    expect(formatClinicDate('2026-01-01')).toBe('1 January 2026');
  });

  it('returns the input unchanged when invalid', () => {
    expect(formatClinicDate('nope')).toBe('nope');
  });
});

describe('appointmentReference', () => {
  it('derives a stable, human-readable reference', () => {
    expect(appointmentReference('00000000-0000-4000-8000-0000000000a1')).toBe('JD-000000A1');
  });
});
