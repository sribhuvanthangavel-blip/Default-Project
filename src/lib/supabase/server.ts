import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig, isProduction } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Request-scoped Supabase client using the visitor's auth cookies.
 * Returns null when the project has not been configured yet, so pages can show
 * a setup notice instead of crashing during a preview build.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  const secure = isProduction();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure,
      httpOnly: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              secure,
              httpOnly: true,
            });
          });
        } catch {
          // Called from a Server Component render, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
