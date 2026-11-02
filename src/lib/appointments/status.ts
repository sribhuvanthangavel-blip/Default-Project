import type { AppointmentStatus } from '@/types/database';

/**
 * Appointment workflow. Mirrored by a database trigger in
 * `supabase/migrations/20261102090000_init_schema.sql` — keep both in sync.
 */
export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export const STATUS_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_DESCRIPTIONS: Record<AppointmentStatus, string> = {
  pending: 'Waiting for the clinic to review and confirm.',
  confirmed: 'The clinic has confirmed this appointment.',
  completed: 'The visit has taken place.',
  cancelled: 'This request was cancelled.',
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: AppointmentStatus): readonly AppointmentStatus[] {
  return STATUS_TRANSITIONS[from];
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === 'string' && APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
}

/** A request is only a booking once staff confirm it. */
export function isConfirmedBooking(status: AppointmentStatus): boolean {
  return status === 'confirmed' || status === 'completed';
}
