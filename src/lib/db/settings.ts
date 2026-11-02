import 'server-only';
import { cache } from 'react';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { EMPTY_PUBLIC_SETTINGS, parsePublicSettings, type PublicSettings } from '@/lib/settings';
import type { SiteSetting } from '@/types/database';

/** Public settings (phone, hours, announcement…) read through RLS. */
export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return EMPTY_PUBLIC_SETTINGS;

  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .eq('is_public', true);

  if (error || !data) return EMPTY_PUBLIC_SETTINGS;
  return parsePublicSettings(data);
});

/** Admin-only full settings list. */
export async function getAllSettings(): Promise<SiteSetting[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('site_settings').select('*').order('setting_key');
  if (error || !data) return [];
  return data;
}
