import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseConfig } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Proxy (formerly middleware).
 *
 * Responsibilities, in order:
 *  1. Generate a per-request CSP nonce and attach the Content-Security-Policy.
 *  2. Refresh the Supabase auth cookie session (server-side, using getUser()).
 *  3. Redirect unauthenticated visitors away from the admin dashboard.
 *
 * The proxy is defence in depth only. Every admin page and every server action
 * independently authorises the caller in `src/lib/auth`.
 */

const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
] as const;

function buildCsp(nonce: string, isDev: boolean): string {
  const supabase = getPublicSupabaseConfig();
  const supabaseOrigin = supabase ? supabase.url : '';

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ];

  const connectSrc = [
    "'self'",
    ...(supabaseOrigin ? [supabaseOrigin, supabaseOrigin.replace('https://', 'wss://')] : []),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export default async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  const nonce = crypto.randomUUID().replace(/-/g, '');

  // Forward the nonce to the render tree so layouts can attach it to scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce, isDev));

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', buildCsp(nonce, isDev));

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (!isAdminRoute) return response;

  const config = getPublicSupabaseConfig();
  if (!config) return response; // Not configured yet: let the pages explain why.

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: !isDev,
      httpOnly: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set('Content-Security-Policy', buildCsp(nonce, isDev));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: !isDev,
            httpOnly: true,
          });
        });
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth; getSession() is not trusted.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicAdminPath = ADMIN_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicAdminPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('reason', 'auth');
    if (pathname !== '/admin') redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Signed-in staff do not need the login screen.
  if (user && pathname === '/admin/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every route except static assets and image optimisation, which
     * cannot execute scripts and do not need auth or a nonce.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)$).*)',
  ],
};
