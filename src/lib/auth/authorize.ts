import 'server-only';
import { redirect } from 'next/navigation';
import { AuthorizationError } from '@/lib/errors';
import { canAccessAdmin, hasAtLeastRole } from './roles';
import { getSessionUser, type SessionUser } from './session';

/**
 * Page guards. Redirect rather than throw so the browser lands somewhere
 * useful. Every server action separately calls requireStaff()/requireAdmin() —
 * proxy and layout checks are defence in depth, never the only check.
 */
export async function requireStaffPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    redirect('/admin/login?reason=auth');
  }
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireStaffPage();
  if (!hasAtLeastRole(user.role, 'admin')) {
    redirect('/admin?reason=forbidden');
  }
  return user;
}

/** Server-action guards. Throw so the action can return a safe error. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) throw new AuthorizationError();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !hasAtLeastRole(user.role, 'admin')) throw new AuthorizationError();
  return user;
}
