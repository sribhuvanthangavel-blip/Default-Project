import 'server-only';
import { createHash } from 'node:crypto';
import { getRateLimitSalt } from '@/lib/env';

/**
 * Best-effort client IP extraction behind Vercel's proxy. The value is only
 * hashed in memory for rate limiting and is never stored or logged.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return 'unknown';
}

export function hashClientIp(ip: string): string {
  return createHash('sha256').update(`${getRateLimitSalt()}:${ip}`).digest('hex').slice(0, 32);
}
