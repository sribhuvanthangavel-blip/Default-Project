import { z } from 'zod';

/**
 * Environment access. Kept free of `server-only` so the proxy can use it too.
 * Missing Supabase configuration is treated as a first-class state rather than
 * a crash, so the site can build and render honest "configuration required"
 * states before credentials are supplied.
 */

const urlSchema = z.string().url();

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export function getPublicSupabaseConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  const parsed = urlSchema.safeParse(url);
  if (!parsed.success) return null;
  if (anonKey.length < 20) return null;

  return { url: parsed.data.replace(/\/$/, ''), anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseConfig() !== null;
}

export function getServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key && key.length > 20 ? key : null;
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export function getClinicTimeZone(): string {
  const candidate = process.env.CLINIC_TIMEZONE?.trim() || 'Asia/Kolkata';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: candidate });
    return candidate;
  } catch {
    return 'UTC';
  }
}

export function getRateLimitSalt(): string {
  // The salt only strengthens in-memory hashing of IPs. A random per-process
  // fallback is acceptable because nothing is persisted.
  return process.env.RATE_LIMIT_SALT?.trim() || 'jishnus-dentistry-local-rate-limit';
}

export const SITE_NAME = "Jishnu's Dentistry";
export const SITE_DESCRIPTION =
  'A calm, considered dental practice. Request an appointment and the clinic will confirm the details with you directly.';

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
