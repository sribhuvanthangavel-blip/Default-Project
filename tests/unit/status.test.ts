import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_STATUSES,
  canTransition,
  getAllowedTransitions,
  isAppointmentStatus,
  isConfirmedBooking,
  isTerminalStatus,
} from '@/lib/appointments/status';

describe('appointment status workflow', () => {
  it('allows only the documented transitions', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'completed')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
  });

  it('blocks transitions that skip a step or go backwards', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
    expect(canTransition('confirmed', 'pending')).toBe(false);
    expect(canTransition('completed', 'cancelled')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });

  it('treats completed and cancelled as terminal', () => {
    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('cancelled')).toBe(true);
    expect(isTerminalStatus('pending')).toBe(false);
    expect(isTerminalStatus('confirmed')).toBe(false);
  });

  it('exposes the same transitions the database trigger enforces', () => {
    expect(getAllowedTransitions('pending')).toEqual(['confirmed', 'cancelled']);
    expect(getAllowedTransitions('confirmed')).toEqual(['completed', 'cancelled']);
    expect(getAllowedTransitions('completed')).toEqual([]);
    expect(getAllowedTransitions('cancelled')).toEqual([]);
  });

  it('only counts confirmed or completed as a real booking', () => {
    expect(isConfirmedBooking('pending')).toBe(false);
    expect(isConfirmedBooking('confirmed')).toBe(true);
    expect(isConfirmedBooking('completed')).toBe(true);
    expect(isConfirmedBooking('cancelled')).toBe(false);
  });

  it('guards unknown status strings', () => {
    expect(isAppointmentStatus('pending')).toBe(true);
    expect(isAppointmentStatus('PENDING')).toBe(false);
    expect(isAppointmentStatus(undefined)).toBe(false);
    expect(isAppointmentStatus(3)).toBe(false);
    expect(APPOINTMENT_STATUSES).toHaveLength(4);
  });
});
