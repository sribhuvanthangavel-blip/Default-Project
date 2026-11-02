import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AppRole } from '@/types/database';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
}

/**
 * Resolves the *validated* Supabase user (getUser() checks the JWT with the
 * Auth server) and loads the profile through RLS. Deduplicated per request.
 *
 * Any user whose profile is missing or still `pending` is treated as
 * unauthenticated for admin purposes.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    email: profile.email || user.email || '',
    fullName: profile.full_name,
    role: profile.role,
  };
});
