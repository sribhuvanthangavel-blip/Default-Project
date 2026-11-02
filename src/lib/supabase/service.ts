import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig, getServiceRoleKey } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Service-role client. **Server-only.** Used in exactly two narrow places:
 *
 *  1. Duplicate-submission detection on public forms (cannot be done through
 *     RLS without leaking whether a given email has booked before).
 *  2. The offline admin provisioning script.
 *
 * It is never imported by a client component, never exposed through a
 * NEXT_PUBLIC_ variable, and never used to bypass RLS for normal operations.
 */
export function createServiceRoleClient(): SupabaseClient<Database> | null {
  const config = getPublicSupabaseConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) return null;

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
