/**
 * In-process fixed-window rate limiter.
 *
 * Limitation (documented in docs/SECURITY.md): Vercel may run multiple
 * serverless instances, so this protects each instance independently. The
 * application therefore also uses a database duplicate check and recommends
 * Vercel WAF rate limiting as the primary distributed control.
 */
import type { RateLimitResult } from './rate-limit-types';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly options: RateLimiterOptions) {}

  check(key: string, now: number = Date.now()): RateLimitResult {
    this.evictIfNeeded(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.options.windowMs });
      return {
        ok: true,
        remaining: Math.max(0, this.options.limit - 1),
        retryAfterSeconds: Math.ceil(this.options.windowMs / 1000),
      };
    }

    if (existing.count >= this.options.limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    }

    existing.count += 1;
    return {
      ok: true,
      remaining: Math.max(0, this.options.limit - existing.count),
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  reset(key?: string): void {
    if (key === undefined) this.buckets.clear();
    else this.buckets.delete(key);
  }

  size(): number {
    return this.buckets.size;
  }

  private evictIfNeeded(now: number): void {
    const maxKeys = this.options.maxKeys ?? 5000;
    if (this.buckets.size < maxKeys) return;

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }

    // Still full of live buckets: drop the oldest entries (Map preserves order).
    while (this.buckets.size >= maxKeys) {
      const oldest = this.buckets.keys().next();
      if (oldest.done) break;
      this.buckets.delete(oldest.value);
    }
  }
}

/** Public forms: 5 submissions per 10 minutes per visitor. */
export const publicFormRateLimiter = new RateLimiter({ limit: 5, windowMs: 10 * 60_000 });

/** Login: 10 attempts per 15 minutes per visitor. */
export const loginRateLimiter = new RateLimiter({ limit: 10, windowMs: 15 * 60_000 });
