import type { AppRole } from '@/types/database';

/**
 * Pure role rules. Kept free of Next.js / Supabase imports so they are unit
 * testable and can be reused by both pages and server actions.
 *
 * `pending` is the default role for any newly created auth user and grants no
 * dashboard access at all.
 */
const ROLE_RANK: Record<AppRole, number> = {
  pending: 0,
  staff: 1,
  admin: 2,
};

export const ASSIGNABLE_ROLES: readonly AppRole[] = ['staff', 'admin'] as const;

export function hasAtLeastRole(role: AppRole, required: AppRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export function canAccessAdmin(role: AppRole): boolean {
  return hasAtLeastRole(role, 'staff');
}

export function canManageAppointments(role: AppRole): boolean {
  return hasAtLeastRole(role, 'staff');
}

export function canManageMessages(role: AppRole): boolean {
  return hasAtLeastRole(role, 'staff');
}

export function canManageServices(role: AppRole): boolean {
  return hasAtLeastRole(role, 'admin');
}

export function canManageSettings(role: AppRole): boolean {
  return hasAtLeastRole(role, 'admin');
}

export function canViewAuditLogs(role: AppRole): boolean {
  return hasAtLeastRole(role, 'admin');
}

/**
 * Role changes are intentionally impossible through the application. They are
 * provisioned with the service role (SQL or `npm run admin:create`).
 */
export function canChangeRoles(): false {
  return false;
}

export function isAppRole(value: unknown): value is AppRole {
  return value === 'pending' || value === 'staff' || value === 'admin';
}
