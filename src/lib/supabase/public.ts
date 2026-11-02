import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Anonymous, cookie-less client for public reads (active services, public
 * settings). RLS still applies, so this client can never read patient data.
 */
export function createPublicSupabaseClient(): SupabaseClient<Database> | null {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
