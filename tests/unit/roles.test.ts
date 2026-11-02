import { describe, expect, it } from 'vitest';
import {
  canAccessAdmin,
  canChangeRoles,
  canManageAppointments,
  canManageServices,
  canManageSettings,
  canViewAuditLogs,
  hasAtLeastRole,
  isAppRole,
} from '@/lib/auth/roles';

describe('role rules', () => {
  it('keeps pending users out of the dashboard entirely', () => {
    expect(canAccessAdmin('pending')).toBe(false);
    expect(canManageAppointments('pending')).toBe(false);
    expect(canManageServices('pending')).toBe(false);
    expect(canManageSettings('pending')).toBe(false);
    expect(canViewAuditLogs('pending')).toBe(false);
  });

  it('lets staff run operations but not configuration', () => {
    expect(canAccessAdmin('staff')).toBe(true);
    expect(canManageAppointments('staff')).toBe(true);
    expect(canManageServices('staff')).toBe(false);
    expect(canManageSettings('staff')).toBe(false);
    expect(canViewAuditLogs('staff')).toBe(false);
  });

  it('gives admins everything', () => {
    expect(canAccessAdmin('admin')).toBe(true);
    expect(canManageServices('admin')).toBe(true);
    expect(canManageSettings('admin')).toBe(true);
    expect(canViewAuditLogs('admin')).toBe(true);
  });

  it('compares roles by rank', () => {
    expect(hasAtLeastRole('admin', 'staff')).toBe(true);
    expect(hasAtLeastRole('staff', 'admin')).toBe(false);
    expect(hasAtLeastRole('pending', 'pending')).toBe(true);
  });

  it('never allows role escalation through the application', () => {
    expect(canChangeRoles()).toBe(false);
  });

  it('validates role strings', () => {
    expect(isAppRole('admin')).toBe(true);
    expect(isAppRole('owner')).toBe(false);
    expect(isAppRole(null)).toBe(false);
  });
});
