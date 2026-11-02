import 'server-only';
import { AppError, NotFoundError } from '@/lib/errors';
import { sanitizeSearchTerm } from '@/lib/security/search';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContactMessageInput } from '@/lib/validation/forms';
import type { ContactMessage, ContactMessageStatus } from '@/types/database';
import type { PaginatedResult } from './types';

export async function createContactMessage(input: ContactMessageInput): Promise<{ id: string }> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    throw new AppError('configuration', 'Messages are temporarily unavailable.');
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? '',
      message: input.message,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new AppError(
      'database',
      'We could not send your message. Please try again, or call the clinic directly.',
      { cause: error },
    );
  }
  return { id: data.id };
}

export async function hasRecentDuplicateMessage(input: {
  email: string;
  windowMinutes?: number;
}): Promise<boolean> {
  const client = createServiceRoleClient();
  if (!client) return false;

  const since = new Date(Date.now() - (input.windowMinutes ?? 30) * 60_000).toISOString();
  const { count } = await client
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('email', input.email);

  return (count ?? 0) > 0;
}

export interface MessageFilters {
  search?: string;
  status?: ContactMessageStatus | 'all';
  page?: number;
  pageSize?: number;
}

export async function listContactMessages(
  filters: MessageFilters,
): Promise<PaginatedResult<ContactMessage>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize === 20 || filters.pageSize === 50 ? filters.pageSize : 10;

  let query = supabase.from('contact_messages').select('*', { count: 'exact' });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const term = sanitizeSearchTerm(filters.search);
  if (term) {
    const pattern = `%${term.replace(/["\\]/g, '')}%`;
    query = query.or(`name.ilike."${pattern}",email.ilike."${pattern}",message.ilike."${pattern}"`);
  }

  const start = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1);

  if (error) {
    throw new AppError('database', 'Unable to load messages right now.', { cause: error });
  }

  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateMessageStatus(id: string, status: ContactMessageStatus): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new AppError('database', 'Unable to update that message right now.', { cause: error });
  }
  if (!data) throw new NotFoundError('That message no longer exists.');
}
