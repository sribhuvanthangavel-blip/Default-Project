import 'server-only';
import { AppError, ConflictError, NotFoundError } from '@/lib/errors';
import { canTransition } from '@/lib/appointments/status';
import { todayInTimeZone } from '@/lib/dates';
import { getClinicTimeZone } from '@/lib/env';
import { sanitizeSearchTerm } from '@/lib/security/search';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AppointmentRequestInput } from '@/lib/validation/forms';
import type { AppointmentStatus } from '@/types/database';
import {
  APPOINTMENT_PAGE_SIZES,
  DEFAULT_PAGE_SIZE,
  type AppointmentFilters,
  type AppointmentStats,
  type AppointmentWithService,
  type PaginatedResult,
} from './types';

const SAVE_FAILED =
  'We could not save your request. Please try again, or contact the clinic directly.';

export async function createAppointmentRequest(
  input: AppointmentRequestInput,
): Promise<{ id: string }> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    throw new AppError('configuration', 'Appointment requests are temporarily unavailable.');
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_name: input.patientName,
      phone: input.phone,
      email: input.email,
      service_id: input.serviceId,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      message: input.message ?? '',
      consent_given: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new AppError('database', SAVE_FAILED, { cause: error });
  }
  return { id: data.id };
}

/**
 * Duplicate detection cannot go through RLS (the visitor must not be able to
 * probe whether an email has booked). The service-role client is used for a
 * count-only query and nothing is returned to the visitor beyond "received".
 */
export async function hasRecentDuplicateAppointment(input: {
  email: string;
  phone: string;
  windowMinutes?: number;
}): Promise<boolean> {
  const client = createServiceRoleClient();
  if (!client) return false;

  const windowMinutes = input.windowMinutes ?? 60;
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count: emailCount } = await client
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('email', input.email);

  if ((emailCount ?? 0) > 0) return true;

  const { count: phoneCount } = await client
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('phone', input.phone);

  return (phoneCount ?? 0) > 0;
}

function mapAppointment(row: unknown): AppointmentWithService {
  const record = row as AppointmentWithService & {
    services: { name: string; slug: string } | null;
  };
  return { ...record, service: record.services ?? null };
}

export async function listAppointments(
  filters: AppointmentFilters,
): Promise<PaginatedResult<AppointmentWithService>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = APPOINTMENT_PAGE_SIZES.includes(
    (filters.pageSize ?? DEFAULT_PAGE_SIZE) as (typeof APPOINTMENT_PAGE_SIZES)[number],
  )
    ? (filters.pageSize ?? DEFAULT_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  let query = supabase.from('appointments').select('*, services(name, slug)', { count: 'exact' });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const term = sanitizeSearchTerm(filters.search);
  if (term) {
    // Values are double-quoted so apostrophes in names are safe; any double
    // quote or backslash was stripped by the sanitiser.
    const pattern = `%${term.replace(/["\\]/g, '')}%`;
    query = query.or(
      `patient_name.ilike."${pattern}",email.ilike."${pattern}",phone.ilike."${pattern}"`,
    );
  }

  if (filters.from) query = query.gte('preferred_date', filters.from);
  if (filters.to) query = query.lte('preferred_date', filters.to);

  const start = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1);

  if (error) {
    throw new AppError('database', 'Unable to load appointment requests right now.', {
      cause: error,
    });
  }

  const total = count ?? 0;
  return {
    items: (data ?? []).map(mapAppointment),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAppointmentById(id: string): Promise<AppointmentWithService | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const { data, error } = await supabase
    .from('appointments')
    .select('*, services(name, slug)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError('database', 'Unable to load that appointment right now.', { cause: error });
  }
  if (!data) return null;
  return mapAppointment(data);
}

export async function updateAppointmentStatus(
  id: string,
  nextStatus: AppointmentStatus,
): Promise<{ status: AppointmentStatus; previousStatus: AppointmentStatus }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const { data: current, error: readError } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (readError) {
    throw new AppError('database', 'Unable to update that appointment right now.', {
      cause: readError,
    });
  }
  if (!current) throw new NotFoundError('That appointment no longer exists.');

  if (current.status === nextStatus) {
    return { status: current.status, previousStatus: current.status };
  }

  if (!canTransition(current.status, nextStatus)) {
    throw new ConflictError('That status change is not allowed from the current state.');
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status: nextStatus })
    .eq('id', id)
    .select('status')
    .single();

  if (error || !data) {
    throw new AppError('database', 'Unable to update that appointment right now.', {
      cause: error,
    });
  }
  return { status: data.status, previousStatus: current.status };
}

export async function updateAppointmentNotes(id: string, notes: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const { error } = await supabase.from('appointments').update({ admin_notes: notes }).eq('id', id);

  if (error) {
    throw new AppError('database', 'Unable to save the note right now.', { cause: error });
  }
}

export async function getAppointmentStats(): Promise<AppointmentStats> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      newMessages: 0,
      activeServices: 0,
      upcoming: 0,
    };
  }

  const today = todayInTimeZone(getClinicTimeZone());

  const countAppointments = (status: AppointmentStatus) =>
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', status);

  const [pending, confirmed, completed, cancelled, newMessages, activeServices, upcoming] =
    await Promise.all([
      countAppointments('pending'),
      countAppointments('confirmed'),
      countAppointments('completed'),
      countAppointments('cancelled'),
      supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed'])
        .gte('preferred_date', today),
    ]);

  return {
    pending: pending.count ?? 0,
    confirmed: confirmed.count ?? 0,
    completed: completed.count ?? 0,
    cancelled: cancelled.count ?? 0,
    newMessages: newMessages.count ?? 0,
    activeServices: activeServices.count ?? 0,
    upcoming: upcoming.count ?? 0,
  };
}

/** Two small counts used for the dashboard navigation badges. */
export async function getNavCounts(): Promise<{ pending: number; newMessages: number }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { pending: 0, newMessages: 0 };

  const [pending, newMessages] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
  ]);

  return { pending: pending.count ?? 0, newMessages: newMessages.count ?? 0 };
}
