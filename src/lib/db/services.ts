import 'server-only';
import { cache } from 'react';
import { AppError } from '@/lib/errors';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Service } from '@/types/database';

/**
 * Public reads use the anonymous client + RLS (active services only) and are
 * memoised per request. No unstable cache is used because the site is rendered
 * dynamically for nonce-based CSP; a clinic-sized catalogue does not need it.
 */
export const listPublicServices = cache(async (): Promise<Service[]> => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return [];
  return data ?? [];
});

export const getPublicServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
});

export async function listAllServices(): Promise<Service[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new AppError('database', 'Unable to load services right now.', { cause: error });
  }
  return data ?? [];
}

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const { data, error } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new AppError('database', 'Unable to load that service right now.', { cause: error });
  }
  return data;
}

export async function countActiveServices(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) return 0;
  return count ?? 0;
}
