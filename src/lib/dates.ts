/** Date handling that is explicit about time zones and avoids UTC off-by-one bugs. */

import { getClinicTimeZone } from '@/lib/env';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isPastDate(dateISO: string, timeZone: string, now: Date = new Date()): boolean {
  if (!isValidISODate(dateISO)) return true;
  return dateISO < todayInTimeZone(timeZone, now);
}

export function isValidTime(value: string): boolean {
  return TIME_24H.test(value);
}

export function normalizeTime(value: string): string {
  const match = TIME_24H.exec(value);
  if (!match) return value;
  return `${match[1]}:${match[2]}`;
}

export function formatClinicDate(dateISO: string): string {
  if (!isValidISODate(dateISO)) return dateISO;
  const date = new Date(`${dateISO}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatClinicDateShort(dateISO: string): string {
  if (!isValidISODate(dateISO)) return dateISO;
  const date = new Date(`${dateISO}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatClinicTime(value: string): string {
  const normalized = normalizeTime(value);
  if (!TIME_24H.test(normalized)) return value;
  const [hours, minutes] = normalized.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return value;
  const suffix = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** Reference shown to a patient, derived from the appointment UUID. */
export function appointmentReference(id: string): string {
  return `JD-${id.replace(/-/g, '').slice(-8).toUpperCase()}`;
}

export function formatDateTime(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

/** Timestamp in the clinic's configured time zone. */
export function formatClinicDateTime(value: string): string {
  return formatDateTime(value, getClinicTimeZone());
}
