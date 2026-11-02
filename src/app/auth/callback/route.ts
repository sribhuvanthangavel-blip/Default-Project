import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseConfig } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/database';

/**
 * Auth callback used by:
 *  - password recovery links (`?code=…` PKCE flow, or `?token_hash=…&type=recovery`)
 *  - email change confirmation
 *
 * Only same-origin, relative destinations are allowed (no open redirects).
 */
function safeNext(candidate: string | null): string {
  if (!candidate) return '/admin';
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/admin';
  return candidate;
}

function failureRedirect(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  url.searchParams.set('reason', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const config = getPublicSupabaseConfig();
  if (!config) return failureRedirect(request, 'configuration');

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const errorDescription = searchParams.get('error');

  if (errorDescription) {
    logger.warn({ event: 'auth.callback_error', reason: errorDescription });
    return failureRedirect(request, 'link-invalid');
  }

  if (!code && !(tokenHash && type)) {
    return failureRedirect(request, 'link-invalid');
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
          });
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.warn({ event: 'auth.code_exchange_failed' });
      return failureRedirect(request, 'link-invalid');
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'email' | 'email_change' | 'signup' | 'invite' | 'magiclink',
    });
    if (error) {
      logger.warn({ event: 'auth.otp_verify_failed' });
      return failureRedirect(request, 'link-invalid');
    }
  }

  const destination = safeNext(searchParams.get('next'));
  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = '';
  logger.info({ event: 'auth.callback_succeeded' });
  return NextResponse.redirect(url);
}
