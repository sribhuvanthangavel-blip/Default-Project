import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Lightweight health check for uptime monitoring.
 * Exposes only configuration booleans — never keys, URLs or patient data.
 */
export function GET() {
  const body = {
    status: 'ok' as const,
    time: new Date().toISOString(),
    configuration: {
      supabase: isSupabaseConfigured(),
      // Reported as a boolean only; the key itself is never returned.
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      emailNotifications: Boolean(process.env.RESEND_API_KEY?.trim()),
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
