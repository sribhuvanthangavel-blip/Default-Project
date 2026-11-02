import 'server-only';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sanitizeSearchTerm } from '@/lib/security/search';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import type { PaginatedResult } from './types';

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface AuditFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Writes an immutable audit entry through the SECURITY DEFINER RPC. Client
 * inserts are revoked, so the actor is always the authenticated caller.
 * A failure is logged but never leaks to the visitor or blocks the action.
 */
export async function recordAudit(input: {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.rpc('record_audit_log', {
    p_action: input.action,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    logger.error({
      event: 'audit.write_failed',
      action: input.action,
      resourceType: input.resourceType,
    });
  }
}

export async function listAuditLogs(
  filters: AuditFilters,
): Promise<PaginatedResult<AuditLogEntry>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize === 20 || filters.pageSize === 50 ? filters.pageSize : 20;

  let query = supabase.from('audit_logs').select('*', { count: 'exact' });

  const term = sanitizeSearchTerm(filters.search);
  if (term) {
    const pattern = `%${term.replace(/["\\]/g, '')}%`;
    query = query.or(
      `action.ilike."${pattern}",resource_type.ilike."${pattern}",actor_email.ilike."${pattern}"`,
    );
  }

  const start = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1);

  if (error) {
    throw new AppError('database', 'Unable to load the audit log right now.', { cause: error });
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
